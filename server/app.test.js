import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { after, before, test } from "node:test";
import { createApp } from "./app.js";
import { openDatabase } from "./database.js";

const database = openDatabase(":memory:");
const adminKey = "test-admin-secret";
const server = createApp({ database, adminKey }).listen(0, "127.0.0.1");
let baseUrl;

before(async () => {
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
  database.close();
});

async function issue(expiresIn = "7d") {
  return fetch(`${baseUrl}/api/invitations`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ expiresIn, role: "Администратор" }),
  });
}

test("invitation API enforces fixed role, allowed TTLs, hashed tokens, and atomic single-use redemption", async () => {
  const unauthorized = await fetch(`${baseUrl}/api/invitations`, {
    method: "POST",
  });
  assert.equal(unauthorized.status, 401);

  const invalidDuration = await issue("90d");
  assert.equal(invalidDuration.status, 400);

  for (const [expiresIn, duration] of [
    ["24h", 24],
    ["7d", 7 * 24],
    ["30d", 30 * 24],
  ]) {
    const durationResponse = await issue(expiresIn);
    assert.equal(durationResponse.status, 201);
    const invitation = await durationResponse.json();
    const issuedDuration = invitation.expiresAt - invitation.createdAt;
    assert.ok(issuedDuration >= duration * 60 * 60 * 1000 - 100);
    assert.ok(issuedDuration <= duration * 60 * 60 * 1000 + 100);
  }

  const createdResponse = await issue("24h");
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.match(created.token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(created.role, "Логист");
  assert.equal(created.status, "pending");

  const tokenHash = createHash("sha256").update(created.token).digest("hex");
  const stored = database
    .prepare("SELECT token_hash FROM invitations WHERE id = ?")
    .get(created.invitationId);
  assert.equal(stored.token_hash, tokenHash);
  assert.notEqual(stored.token_hash, created.token);

  const verified = await fetch(`${baseUrl}/api/invitations/${created.token}`);
  assert.equal(verified.status, 200);
  assert.deepEqual(await verified.json(), {
    role: "Логист",
    expiresAt: created.expiresAt,
  });

  const user = {
    name: "Demo User",
    email: "demo@example.com",
    password: "secure-password",
    role: "Администратор",
  };
  const redemptionRequests = [
    fetch(`${baseUrl}/api/invitations/${created.token}/redeem`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(user),
    }),
    fetch(`${baseUrl}/api/invitations/${created.token}/redeem`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...user, email: "second@example.com" }),
    }),
  ];
  const redemptions = await Promise.all(redemptionRequests);
  const redemptionStatuses = await Promise.all(
    redemptions.map((response) => response.status),
  );
  assert.deepEqual(redemptionStatuses.slice().sort(), [201, 400]);
  const successfulRequestIndex = redemptionStatuses.indexOf(201);
  const successfulCredentials =
    successfulRequestIndex === 0
      ? user
      : { ...user, email: "second@example.com" };
  const createdUser = await database
    .prepare(
      "SELECT name, email, role, password_hash FROM users WHERE email = ?",
    )
    .get(successfulCredentials.email);
  assert.equal(createdUser.name, successfulCredentials.name);
  assert.equal(createdUser.email, successfulCredentials.email);
  assert.equal(createdUser.role, "Логист");
  assert.match(createdUser.password_hash, /^scrypt\$/);
  assert.ok(!createdUser.password_hash.includes(user.password));

  const validLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: ` ${successfulCredentials.email.toUpperCase()} `,
      password: successfulCredentials.password,
    }),
  });
  assert.equal(validLogin.status, 200);
  const loginResult = await validLogin.json();
  assert.deepEqual(loginResult.user, {
    id: loginResult.user.id,
    name: successfulCredentials.name,
    email: successfulCredentials.email,
    role: "Логист",
  });
  assert.ok(!("password_hash" in loginResult.user));

  for (const credentials of [
    { email: successfulCredentials.email, password: "incorrect-password" },
    { email: "unknown@example.com", password: successfulCredentials.password },
  ]) {
    const invalidLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(credentials),
    });
    assert.equal(invalidLogin.status, 401);
    assert.deepEqual(await invalidLogin.json(), {
      error: "Неверный email или пароль",
    });
  }

  const consumed = await fetch(`${baseUrl}/api/invitations/${created.token}`);
  assert.equal(consumed.status, 400);

  const expiredResponse = await issue("30d");
  const expired = await expiredResponse.json();
  database
    .prepare("UPDATE invitations SET expires_at = ? WHERE id = ?")
    .run(Date.now() - 1, expired.invitationId);
  const rejectedExpired = await fetch(
    `${baseUrl}/api/invitations/${expired.token}`,
  );
  assert.equal(rejectedExpired.status, 400);

  const listing = await fetch(`${baseUrl}/api/invitations`, {
    headers: { "x-admin-key": adminKey },
  });
  const listed = await listing.json();
  assert.ok(
    listed.invitations.some((invitation) => invitation.status === "redeemed"),
  );
  assert.ok(
    listed.invitations.some((invitation) => invitation.status === "expired"),
  );
  assert.ok(
    listed.invitations.every(
      (invitation) => !("token" in invitation) && !("token_hash" in invitation),
    ),
  );
});

test("invalid signup data and duplicate email do not consume a different invitation", async () => {
  const firstInvitation = await issue();
  const first = await firstInvitation.json();

  const invalidSignup = await fetch(
    `${baseUrl}/api/invitations/${first.token}/redeem`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Demo User",
        email: "invalid-signup@example.com",
        password: "short",
      }),
    },
  );
  assert.equal(invalidSignup.status, 400);
  assert.equal(
    (await fetch(`${baseUrl}/api/invitations/${first.token}`)).status,
    200,
  );

  const successfulSignup = await fetch(
    `${baseUrl}/api/invitations/${first.token}/redeem`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Demo User",
        email: "duplicate-check@example.com",
        password: "secure-password",
      }),
    },
  );
  assert.equal(successfulSignup.status, 201);

  const secondInvitation = await issue();
  const second = await secondInvitation.json();
  const duplicateEmail = await fetch(
    `${baseUrl}/api/invitations/${second.token}/redeem`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Another User",
        email: "duplicate-check@example.com",
        password: "secure-password",
      }),
    },
  );
  assert.equal(duplicateEmail.status, 409);
  assert.equal(
    (await fetch(`${baseUrl}/api/invitations/${second.token}`)).status,
    200,
  );
});

test("admin endpoints fail closed when the server has no admin key", async () => {
  const unconfiguredDatabase = openDatabase(":memory:");
  const unconfiguredServer = createApp({
    database: unconfiguredDatabase,
    adminKey: "",
  }).listen(0, "127.0.0.1");

  try {
    await new Promise((resolve) =>
      unconfiguredServer.once("listening", resolve),
    );
    const unconfiguredUrl = `http://127.0.0.1:${unconfiguredServer.address().port}`;
    const createResponse = await fetch(`${unconfiguredUrl}/api/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ expiresIn: "7d" }),
    });
    const listResponse = await fetch(`${unconfiguredUrl}/api/invitations`);

    assert.equal(createResponse.status, 503);
    assert.equal(listResponse.status, 503);
  } finally {
    await new Promise((resolve, reject) =>
      unconfiguredServer.close((error) => (error ? reject(error) : resolve())),
    );
    unconfiguredDatabase.close();
  }
});
