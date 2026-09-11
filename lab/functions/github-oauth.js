const ADMIN_REPOSITORY = "looksawful/looksawful.ru";
const PRODUCTION_ORIGIN = "https://admin.looksawful.ru";
const LOCAL_ORIGIN = "http://127.0.0.1:8787";
const STATE_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

function hasValue(value) {
  return typeof value === "string" && value.length > 0;
}

function configurationReady(env) {
  return (
    hasValue(env?.ADMIN_GITHUB_CLIENT_ID) &&
    hasValue(env?.ADMIN_GITHUB_CLIENT_SECRET) &&
    hasValue(env?.ADMIN_SESSION_SECRET)
  );
}

function allowedOrigin(url) {
  return url.origin === PRODUCTION_ORIGIN || url.origin === LOCAL_ORIGIN;
}

function isLocal(url) {
  return url.origin === LOCAL_ORIGIN;
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlDecode(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function signToken(payload, secret) {
  const body = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(
    await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body)),
  );
  return `${body}.${base64UrlEncode(signature)}`;
}

async function verifyToken(token, secret, expectedKind) {
  if (!hasValue(token) || !hasValue(secret)) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) return null;

  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      base64UrlDecode(signature),
      encoder.encode(body),
    );
  } catch {
    return null;
  }
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body)));
    if (payload?.kind !== expectedKind) return null;
    if (!Number.isFinite(payload?.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function randomNonce() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function cookieMap(request) {
  const result = new Map();
  const header = request.headers.get("Cookie") ?? "";
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    result.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }
  return result;
}

function cookieNames(url) {
  if (isLocal(url)) {
    return {
      state: "looksawful-oauth-state",
      session: "looksawful-admin",
    };
  }
  return {
    state: "__Host-looksawful-oauth-state",
    session: "__Host-looksawful-admin",
  };
}

function cookie(name, value, maxAge, secure) {
  const parts = [
    `${name}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function redirect(location, cookies = []) {
  const headers = new Headers({ Location: location });
  for (const value of cookies) headers.append("Set-Cookie", value);
  return new Response(null, { status: 302, headers });
}

function textResponse(message, status) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function redirectUri(url) {
  return new URL("/auth/github/callback", url.origin).toString();
}

async function beginOAuth(request, env) {
  const url = new URL(request.url);
  if (!configurationReady(env)) return textResponse("Admin authentication is not configured.", 503);
  if (!allowedOrigin(url)) return textResponse("Admin authentication origin is not allowed.", 403);

  const names = cookieNames(url);
  const state = await signToken(
    {
      kind: "oauth-state",
      nonce: randomNonce(),
      exp: Math.floor(Date.now() / 1000) + STATE_TTL_SECONDS,
    },
    env.ADMIN_SESSION_SECRET,
  );

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.ADMIN_GITHUB_CLIENT_ID);
  authorize.searchParams.set("redirect_uri", redirectUri(url));
  authorize.searchParams.set("state", state);

  return redirect(authorize.toString(), [
    cookie(names.state, state, STATE_TTL_SECONDS, !isLocal(url)),
  ]);
}

async function exchangeCode(request, env, fetcher) {
  const url = new URL(request.url);
  if (!configurationReady(env)) return textResponse("Admin authentication is not configured.", 503);
  if (!allowedOrigin(url)) return textResponse("Admin authentication origin is not allowed.", 403);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const names = cookieNames(url);
  const storedState = cookieMap(request).get(names.state);
  if (!code || !state || !storedState || state !== storedState) {
    return textResponse("Invalid OAuth state.", 400);
  }
  if (!(await verifyToken(state, env.ADMIN_SESSION_SECRET, "oauth-state"))) {
    return textResponse("Invalid or expired OAuth state.", 400);
  }

  const tokenResponse = await fetcher("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.ADMIN_GITHUB_CLIENT_ID,
      client_secret: env.ADMIN_GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri(url),
    }),
  });
  if (!tokenResponse.ok) return textResponse("GitHub OAuth exchange failed.", 502);

  const tokenPayload = await tokenResponse.json();
  const accessToken = tokenPayload?.access_token;
  const grantedScopes = typeof tokenPayload?.scope === "string" ? tokenPayload.scope.trim() : "";
  if (!hasValue(accessToken)) return textResponse("GitHub OAuth token is missing.", 502);
  if (grantedScopes.length > 0) {
    return textResponse("GitHub OAuth returned unexpected permissions.", 403);
  }

  const repositoriesResponse = await fetcher(
    "https://api.github.com/user/repos?affiliation=owner&visibility=public&per_page=100",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2026-03-10",
      },
    },
  );
  if (!repositoriesResponse.ok) return textResponse("GitHub identity verification failed.", 502);

  const repositories = await repositoriesResponse.json();
  const ownedRepository = Array.isArray(repositories)
    ? repositories.find((repository) => repository?.full_name === ADMIN_REPOSITORY)
    : null;
  if (!ownedRepository) return textResponse("GitHub account is not authorized for this Admin.", 403);

  const session = await signToken(
    {
      kind: "admin-session",
      repository: ADMIN_REPOSITORY,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    },
    env.ADMIN_SESSION_SECRET,
  );

  return redirect(new URL("/lab/", url.origin).toString(), [
    cookie(names.state, "", 0, !isLocal(url)),
    cookie(names.session, session, SESSION_TTL_SECONDS, !isLocal(url)),
  ]);
}

function logout(request) {
  const url = new URL(request.url);
  const names = cookieNames(url);
  return redirect(new URL("/auth/github", url.origin).toString(), [
    cookie(names.state, "", 0, !isLocal(url)),
    cookie(names.session, "", 0, !isLocal(url)),
  ]);
}

export async function handleGitHubOAuth({ request, env, fetch: fetcher = fetch }) {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/auth/github") return beginOAuth(request, env);
  if (pathname === "/auth/github/callback") return exchangeCode(request, env, fetcher);
  if (pathname === "/auth/logout") return logout(request);
  return null;
}

export async function verifyAdminSession(request, env) {
  if (!hasValue(env?.ADMIN_SESSION_SECRET)) return null;
  const url = new URL(request.url);
  if (!allowedOrigin(url)) return null;
  const names = cookieNames(url);
  const token = cookieMap(request).get(names.session);
  const payload = await verifyToken(token, env.ADMIN_SESSION_SECRET, "admin-session");
  if (payload?.repository !== ADMIN_REPOSITORY) return null;
  return payload;
}
