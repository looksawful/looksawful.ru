import {
  HUMAN_SESSION_SECONDS,
  createSessionToken,
  requireAuthConfig,
  requestHasSameOrigin,
  safeNextPath,
  secureResponse,
  sessionSetCookie,
  unavailableResponse,
  verifyHashedSecret,
} from "../_lib/auth.js";

const MAX_FORM_BYTES = 2048;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function loginPage(nextPath, { invalid = false } = {}) {
  const message = invalid ? "<p>Invalid password.</p>" : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Private preview</title>
</head>
<body>
  <main>
    <h1>Private preview</h1>
    ${message}
    <form method="post" action="/__preview/login">
      <input type="hidden" name="next" value="${escapeHtml(nextPath)}">
      <label>Password <input name="password" type="password" autocomplete="current-password" required autofocus></label>
      <button type="submit">Enter</button>
    </form>
  </main>
</body>
</html>\n`;
}

function htmlResponse(body, status = 200) {
  return secureResponse(new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  }));
}

export async function onRequest({ request, env }) {
  let config;
  try {
    config = requireAuthConfig(env);
  } catch {
    return unavailableResponse();
  }

  const url = new URL(request.url);
  if (request.method === "GET" || request.method === "HEAD") {
    const nextPath = safeNextPath(url.searchParams.get("next") ?? "/", url.origin);
    return htmlResponse(request.method === "HEAD" ? null : loginPage(nextPath));
  }

  if (request.method !== "POST") {
    return secureResponse(new Response("Method Not Allowed\n", {
      status: 405,
      headers: { allow: "GET, HEAD, POST", "content-type": "text/plain; charset=utf-8" },
    }));
  }

  if (!requestHasSameOrigin(request)) {
    return secureResponse(new Response("Forbidden\n", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }));
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FORM_BYTES) {
    return secureResponse(new Response("Request body too large.\n", { status: 413 }));
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_FORM_BYTES) {
    return secureResponse(new Response("Request body too large.\n", { status: 413 }));
  }

  const form = new URLSearchParams(body);
  const nextPath = safeNextPath(form.get("next") ?? "/", url.origin);
  const password = form.get("password") ?? "";
  if (!(await verifyHashedSecret(password, config.passwordHash))) {
    return htmlResponse(loginPage(nextPath, { invalid: true }), 401);
  }

  const token = await createSessionToken({
    host: url.host,
    secret: config.sessionSecret,
    ttlSeconds: HUMAN_SESSION_SECONDS,
  });
  return secureResponse(new Response(null, {
    status: 303,
    headers: {
      location: nextPath,
      "set-cookie": sessionSetCookie(token, HUMAN_SESSION_SECONDS),
    },
  }));
}
