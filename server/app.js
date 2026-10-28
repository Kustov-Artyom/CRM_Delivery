import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import express from "express";

const scryptAsync = promisify(scrypt);
const FIXED_ROLE = "Логист";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const DURATIONS = new Map([
  ["24h", 24 * 60 * 60 * 1000],
  ["7d", 7 * 24 * 60 * 60 * 1000],
  ["30d", 30 * 24 * 60 * 60 * 1000],
]);

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function equalSecret(actual, expected) {
  const actualHash = createHash("sha256").update(actual).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

async function verifyPassword(password, encodedHash) {
  const parts = typeof encodedHash === "string" ? encodedHash.split("$") : [];
  const validHash =
    parts.length === 3 &&
    parts[0] === "scrypt" &&
    /^[a-f0-9]{32}$/i.test(parts[1]) &&
    /^[a-f0-9]{128}$/i.test(parts[2]);
  const salt = validHash ? Buffer.from(parts[1], "hex") : Buffer.alloc(16);
  const expected = validHash ? Buffer.from(parts[2], "hex") : Buffer.alloc(64);
  const actual = await scryptAsync(password, salt, expected.length);
  return validHash && timingSafeEqual(actual, expected);
}

function invalidInvitation(response) {
  return response
    .status(400)
    .json({ error: "Приглашение недействительно или уже использовано" });
}

export function createApp({
  database,
  adminKey = process.env.INVITATION_ADMIN_KEY,
} = {}) {
  if (!database) throw new Error("A SQLite database connection is required");

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));
  app.use("/api", (_request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
  });

  const requireAdminKey = (request, response, next) => {
    if (!adminKey) {
      return response
        .status(503)
        .json({ error: "Не настроен ключ администрирования приглашений" });
    }
    const provided = request.get("x-admin-key") || "";
    if (!equalSecret(provided, adminKey)) {
      return response.status(401).json({ error: "Нет доступа" });
    }
    return next();
  };

  app.post("/api/auth/login", async (request, response, next) => {
    const email =
      typeof request.body?.email === "string"
        ? request.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof request.body?.password === "string" &&
      request.body.password.length <= 256
        ? request.body.password
        : "";
    const user = email
      ? database
          .prepare(
            "SELECT id, name, email, role, password_hash FROM users WHERE email = ?",
          )
          .get(email)
      : null;

    try {
      const passwordMatches = await verifyPassword(
        password,
        user?.password_hash,
      );
      if (!user || !passwordMatches) {
        return response
          .status(401)
          .json({ error: "Неверный email или пароль" });
      }

      return response.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  app.post("/api/invitations", requireAdminKey, (request, response) => {
    const duration = DURATIONS.get(request.body?.expiresIn);
    if (!duration) {
      return response
        .status(400)
        .json({ error: "Срок действия должен быть 24h, 7d или 30d" });
    }

    const token = randomBytes(32).toString("base64url");
    const createdAt = Date.now();
    const expiresAt = createdAt + duration;
    const result = database
      .prepare(
        `
      INSERT INTO invitations (token_hash, role, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `,
      )
      .run(hashToken(token), FIXED_ROLE, createdAt, expiresAt);

    return response.status(201).json({
      token,
      role: FIXED_ROLE,
      createdAt,
      expiresAt,
      status: "pending",
      invitationId: Number(result.lastInsertRowid),
    });
  });

  app.get("/api/invitations", requireAdminKey, (_request, response) => {
    const now = Date.now();
    const invitations = database
      .prepare(
        `
      SELECT id, role, created_at AS createdAt, expires_at AS expiresAt,
        CASE
          WHEN redeemed_at IS NOT NULL THEN 'redeemed'
          WHEN expires_at <= ? THEN 'expired'
          ELSE 'pending'
        END AS status
      FROM invitations
      ORDER BY created_at DESC
    `,
      )
      .all(now);
    return response.json({ invitations });
  });

  app.get("/api/invitations/:token", (request, response) => {
    const { token } = request.params;
    if (!TOKEN_PATTERN.test(token)) return invalidInvitation(response);

    const invitation = database
      .prepare(
        `
      SELECT role, expires_at AS expiresAt
      FROM invitations
      WHERE token_hash = ? AND redeemed_at IS NULL AND expires_at > ?
    `,
      )
      .get(hashToken(token), Date.now());

    if (!invitation) return invalidInvitation(response);
    return response.json(invitation);
  });

  app.post(
    "/api/invitations/:token/redeem",
    async (request, response, next) => {
      const { token } = request.params;
      if (!TOKEN_PATTERN.test(token)) return invalidInvitation(response);

      const name =
        typeof request.body?.name === "string" ? request.body.name.trim() : "";
      const email =
        typeof request.body?.email === "string"
          ? request.body.email.trim().toLowerCase()
          : "";
      const password =
        typeof request.body?.password === "string" ? request.body.password : "";
      if (
        !name ||
        name.length > 120 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 254 ||
        password.length < 8 ||
        password.length > 256
      ) {
        return response.status(400).json({
          error: "Проверьте имя, email и пароль (не менее 8 символов)",
        });
      }

      const tokenHash = hashToken(token);
      const currentInvitation = database
        .prepare(
          `
      SELECT id FROM invitations
      WHERE token_hash = ? AND redeemed_at IS NULL AND expires_at > ?
    `,
        )
        .get(tokenHash, Date.now());
      if (!currentInvitation) return invalidInvitation(response);

      const existingUser = database
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email);
      if (existingUser)
        return response
          .status(409)
          .json({ error: "Пользователь с таким email уже зарегистрирован" });

      try {
        const salt = randomBytes(16);
        const derivedKey = await scryptAsync(password, salt, 64);
        const passwordHash = `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
        const now = Date.now();

        database.exec("BEGIN IMMEDIATE");
        const invitation = database
          .prepare(
            `
        SELECT id FROM invitations
        WHERE token_hash = ? AND redeemed_at IS NULL AND expires_at > ?
      `,
          )
          .get(tokenHash, now);
        if (!invitation) {
          database.exec("ROLLBACK");
          return invalidInvitation(response);
        }

        const insertedUser = database
          .prepare(
            `
        INSERT INTO users (name, email, password_hash, role, created_at, invitation_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
          )
          .run(name, email, passwordHash, FIXED_ROLE, now, invitation.id);
        const redeemed = database
          .prepare(
            `
        UPDATE invitations SET redeemed_at = ?
        WHERE id = ? AND redeemed_at IS NULL AND expires_at > ?
      `,
          )
          .run(now, invitation.id, now);
        if (redeemed.changes !== 1) {
          database.exec("ROLLBACK");
          return invalidInvitation(response);
        }

        database.exec("COMMIT");
        return response.status(201).json({
          userId: Number(insertedUser.lastInsertRowid),
          role: FIXED_ROLE,
        });
      } catch (error) {
        if (database.isTransaction) database.exec("ROLLBACK");
        if (error.code?.startsWith("ERR_SQLITE_CONSTRAINT")) {
          return response.status(409).json({
            error: "Email уже зарегистрирован или приглашение использовано",
          });
        }
        return next(error);
      }
    },
  );

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && "body" in error) {
      return response.status(400).json({ error: "Некорректный JSON" });
    }
    console.error("API request failed", error);
    return response.status(500).json({ error: "Внутренняя ошибка сервера" });
  });

  return app;
}
