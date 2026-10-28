async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Не удалось выполнить запрос");
  }
  return result;
}

export function createInvitation(expiresIn, adminKey) {
  return request("/api/invitations", {
    method: "POST",
    headers: { "X-Admin-Key": adminKey },
    body: JSON.stringify({ expiresIn }),
  });
}

export function listInvitations(adminKey) {
  return request("/api/invitations", {
    headers: { "X-Admin-Key": adminKey },
  });
}

export function verifyInvitation(token) {
  return request(`/api/invitations/${encodeURIComponent(token)}`);
}

export function redeemInvitation(token, user) {
  return request(`/api/invitations/${encodeURIComponent(token)}/redeem`, {
    method: "POST",
    body: JSON.stringify(user),
  });
}
