import {
  createSessionToken,
  passwordMatches,
  verifySessionToken,
} from "./auth.mjs";
import {
  applyCloudflareMediaPatch,
  collectTextEntries,
  isAllowedTextSource,
  replaceTextLeaf,
} from "./domain.mjs";
import {
  commitRepositoryFiles,
  listRepositoryFiles,
  mediaCandidatePaths,
  parseRepositoryName,
  readRepositoryFiles,
} from "./github.mjs";

const LOGIN_PATH = "/tools/media-desk/login/";
const DESK_PATH = "/tools/media-desk/";
const LOGIN_API = "/__media-desk/auth/login";
const LOGOUT_API = "/__media-desk/auth/logout";
const SESSION_API = "/__media-desk/auth/session";
const METADATA_API = "/__media-desk/metadata";
const METADATA_BULK_API = "/__media-desk/metadata/bulk";
const TEXTS_API = "/__media-desk/texts";
const COOKIE_NAME = "__Host-looksawful-media-desk";
const SESSION_MAX_AGE = 12 * 60 * 60;
const MAX_JSON_BYTES = 128 * 1024;
const MAX_BULK_ITEMS = 100;

function required(env, key) {
  const value = env[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing Cloudflare Media Desk setting: ${key}`);
  }
  return value.trim();
}

function runtimeConfig(env) {
  return {
    username: required(env, "MEDIA_DESK_USERNAME"),
    passwordHash: required(env, "MEDIA_DESK_PASSWORD_SHA256"),
    sessionSecret: required(env, "MEDIA_DESK_SESSION_SECRET"),
    githubToken: required(env, "MEDIA_DESK_GITHUB_TOKEN"),
    repository: required(env, "MEDIA_DESK_REPOSITORY"),
    branch: required(env, "MEDIA_DESK_BRANCH"),
    mediaOrigin: required(env, "MEDIA_DESK_MEDIA_ORIGIN"),
  };
}

function baseHeaders() {
  return {
    "cache-control": "no-store",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-robots-tag": "noindex, nofollow, noarchive",
  };
}

function json(status, body, extraHeaders = {}) {
  return new Response(`${JSON.stringify(body)}\n`, {
    status,
    headers: {
      ...baseHeaders(),
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function html(status, body, extraHeaders = {}) {
  return new Response(body, {
    status,
    headers: {
      ...baseHeaders(),
      "content-type": "text/html; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function redirect(location, extraHeaders = {}) {
  return new Response(null, {
    status: 303,
    headers: {
      ...baseHeaders(),
      location,
      ...extraHeaders,
    },
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loginPage(error = "") {
  const errorBlock = error
    ? `<p class="error" role="alert">${escapeHtml(error)}</p>`
    : "";

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Media Desk · looksawful</title>
  <style>
    :root{color-scheme:light;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#f4f4f2;color:#111}
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px}
    main{width:min(100%,380px);background:#fff;border:1px solid #d8d8d3;padding:28px}
    h1{margin:0 0 8px;font-size:22px;font-weight:650}
    p{margin:0 0 22px;color:#666;font-size:14px;line-height:1.45}
    label{display:grid;gap:7px;margin-top:14px;font-size:13px}
    input{width:100%;border:1px solid #c7c7c2;background:#fff;padding:11px 12px;font:inherit}
    input:focus{outline:2px solid #111;outline-offset:1px}
    button{width:100%;margin-top:20px;border:0;background:#111;color:#fff;padding:12px 14px;font:inherit;cursor:pointer}
    .error{margin:14px 0 0;color:#9d1414}
  </style>
</head>
<body>
  <main>
    <h1>Media Desk</h1>
    <p>Закрытая рабочая область looksawful.</p>
    ${errorBlock}
    <form method="post" action="${LOGIN_API}" autocomplete="on">
      <label>Учётная запись<input name="username" autocomplete="username" required maxlength="128"></label>
      <label>Пароль<input name="password" type="password" autocomplete="current-password" required maxlength="512"></label>
      <button type="submit">Войти</button>
    </form>
  </main>
</body>
</html>`;
}

function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const chunk of cookie.split(";")) {
    const [key, ...rest] = chunk.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return undefined;
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}`;
}

function expiredSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

async function authenticated(request, config) {
  const token = cookieValue(request, COOKIE_NAME);
  return token
    ? verifySessionToken(token, config.username, config.sessionSecret)
    : false;
}

function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function readBody(request, maxBytes = MAX_JSON_BYTES) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error("Request body is too large");
  }
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > maxBytes) throw new Error("Request body is too large");
  return new TextDecoder().decode(buffer);
}

async function readJson(request) {
  const source = await readBody(request);
  if (!source) throw new Error("Request body is empty");
  return JSON.parse(source);
}

function parseSave(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Media Desk save request must be an object");
  }
  const keys = Object.keys(value);
  if (keys.some((key) => key !== "id" && key !== "metadata")) {
    throw new Error("Media Desk save request contains unexpected fields");
  }
  if (typeof value.id !== "string") throw new TypeError("Media Desk save request id is invalid");
  if (!value.metadata || typeof value.metadata !== "object" || Array.isArray(value.metadata)) {
    throw new TypeError("Media Desk save request metadata must be an object");
  }
  mediaCandidatePaths(value.id);
  return { id: value.id, metadata: value.metadata };
}

function parseBulk(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError("Media Desk bulk save request must be a non-empty array");
  }
  if (value.length > MAX_BULK_ITEMS) {
    throw new Error(`Media Desk bulk save request exceeds ${MAX_BULK_ITEMS} items`);
  }
  const parsed = value.map(parseSave);
  if (new Set(parsed.map((item) => item.id)).size !== parsed.length) {
    throw new Error("Media Desk bulk save request contains duplicate ids");
  }
  return parsed;
}

async function prepareMediaChanges(requests, config, fetchImpl) {
  const candidatesById = new Map(
    requests.map((request) => [request.id, mediaCandidatePaths(request.id)]),
  );
  const allPaths = [...candidatesById.values()].flat();
  const { headOid, files } = await readRepositoryFiles({
    repository: config.repository,
    branch: config.branch,
    token: config.githubToken,
    paths: allPaths,
    fetchImpl,
  });

  const additions = [];
  const records = [];

  for (const request of requests) {
    const [registeredPath, uploadPath] = candidatesById.get(request.id);
    const registered = files.get(registeredPath);
    const upload = files.get(uploadPath);
    const selected = registered
      ? { path: registeredPath, file: registered, origin: "registered", recordId: request.id }
      : upload
        ? {
            path: uploadPath,
            file: upload,
            origin: "upload",
            recordId: request.id.startsWith("cms-") ? request.id.slice(4) : request.id,
          }
        : null;

    if (!selected) throw new Error(`Media catalog record "${request.id}" was not found`);

    const current = JSON.parse(selected.file.text);
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      throw new Error(`Media catalog record "${request.id}" is invalid`);
    }
    if (current.id !== selected.recordId) {
      throw new Error(`Media catalog record id mismatch for "${request.id}"`);
    }

    const next = applyCloudflareMediaPatch(current, request.metadata, selected.origin);
    additions.push({ path: selected.path, content: `${JSON.stringify(next, null, 2)}\n` });
    records.push(next);
  }

  return { headOid, additions, records };
}

async function saveMedia(requests, config, fetchImpl) {
  const prepared = await prepareMediaChanges(requests, config, fetchImpl);
  const commit = await commitRepositoryFiles({
    repository: config.repository,
    branch: config.branch,
    token: config.githubToken,
    expectedHeadOid: prepared.headOid,
    additions: prepared.additions,
    message: requests.length === 1
      ? `content(media-desk): update ${requests[0].id}`
      : `content(media-desk): update ${requests.length} assets`,
    fetchImpl,
  });
  return { records: prepared.records, commit };
}

async function loadTextSources(config, fetchImpl) {
  const tree = await listRepositoryFiles({
    repository: config.repository,
    branch: config.branch,
    token: config.githubToken,
    fetchImpl,
  });
  const paths = tree.filter(isAllowedTextSource).sort();
  const { files } = await readRepositoryFiles({
    repository: config.repository,
    branch: config.branch,
    token: config.githubToken,
    paths,
    fetchImpl,
  });
  const sources = {};
  for (const path of paths) {
    const file = files.get(path);
    if (!file) continue;
    sources[path] = JSON.parse(file.text);
  }
  return sources;
}

function parseTextSave(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Content Desk text save request must be an object");
  }
  const keys = Object.keys(value);
  if (keys.some((key) => !["sourcePath", "fieldPath", "value"].includes(key))) {
    throw new Error("Content Desk text save request contains unexpected fields");
  }
  if (!isAllowedTextSource(value.sourcePath)) {
    throw new TypeError("Content Desk text source is not editable");
  }
  if (typeof value.fieldPath !== "string" || typeof value.value !== "string") {
    throw new TypeError("Content Desk text save request is invalid");
  }
  return {
    sourcePath: value.sourcePath,
    fieldPath: value.fieldPath,
    value: value.value,
  };
}

async function saveText(payload, config, fetchImpl) {
  const { headOid, files } = await readRepositoryFiles({
    repository: config.repository,
    branch: config.branch,
    token: config.githubToken,
    paths: [payload.sourcePath],
    fetchImpl,
  });
  const file = files.get(payload.sourcePath);
  if (!file) throw new Error(`Content Desk source "${payload.sourcePath}" was not found`);

  const current = JSON.parse(file.text);
  const entries = collectTextEntries({ [payload.sourcePath]: current });
  const allowed = entries.some(
    (entry) => entry.sourcePath === payload.sourcePath && entry.fieldPath === payload.fieldPath,
  );
  if (!allowed) {
    throw new Error(`Content Desk text entry "${payload.sourcePath}#${payload.fieldPath}" is not editable`);
  }

  const next = replaceTextLeaf(current, payload.fieldPath, payload.value);
  const commit = await commitRepositoryFiles({
    repository: config.repository,
    branch: config.branch,
    token: config.githubToken,
    expectedHeadOid: headOid,
    additions: [{ path: payload.sourcePath, content: `${JSON.stringify(next, null, 2)}\n` }],
    message: `content(media-desk): update ${payload.sourcePath}`,
    fetchImpl,
  });

  return {
    entry: {
      sourcePath: payload.sourcePath,
      fieldPath: payload.fieldPath,
      value: payload.value,
    },
    commit,
  };
}

async function proxyMedia(request, config, fetchImpl) {
  const sourceUrl = new URL(request.url);
  const target = new URL(`${sourceUrl.pathname}${sourceUrl.search}`, `${config.mediaOrigin}/`);
  const headers = new Headers();
  for (const name of ["accept", "range", "if-none-match", "if-modified-since"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  let response = await fetchImpl(new Request(target, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers,
    redirect: "follow",
  }));

  if (response.status === 404) {
    const { owner, name } = parseRepositoryName(config.repository);
    const encodedPath = `public${sourceUrl.pathname}`
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/${encodeURIComponent(config.branch)}/${encodedPath}${sourceUrl.search}`;
    response = await fetchImpl(new Request(rawUrl, {
      method: request.method === "HEAD" ? "HEAD" : "GET",
      headers,
      redirect: "follow",
    }));
  }

  return response;
}

async function handleLogin(request, config, env) {
  if (request.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });
  if (!sameOrigin(request)) return json(403, { ok: false, error: "Origin rejected" });

  const source = await readBody(request, 8 * 1024);
  const form = new URLSearchParams(source);
  const username = form.get("username") ?? "";
  const password = form.get("password") ?? "";

  if (!env.LOGIN_RATE_LIMITER || typeof env.LOGIN_RATE_LIMITER.limit !== "function") {
    return json(503, { ok: false, error: "Login rate limiter is unavailable" });
  }

  const rateLimit = await env.LOGIN_RATE_LIMITER.limit({
    key: `login:${username.trim().toLocaleLowerCase()}`,
  });
  if (!rateLimit.success) {
    return html(429, loginPage("Слишком много попыток входа. Попробуйте через минуту."), {
      "retry-after": "60",
    });
  }

  const validPassword = await passwordMatches(password, config.passwordHash);
  if (username !== config.username || !validPassword) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return html(401, loginPage("Неверные данные для входа."));
  }

  const token = await createSessionToken(config.username, config.sessionSecret);
  return redirect(DESK_PATH, { "set-cookie": sessionCookie(token) });
}

async function apiResponse(request, config, fetchImpl) {
  const path = new URL(request.url).pathname;

  try {
    if (!sameOrigin(request) && request.method !== "GET" && request.method !== "HEAD") {
      return json(403, { ok: false, error: "Origin rejected" });
    }

    if (path === METADATA_API) {
      if (request.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });
      const save = parseSave(await readJson(request));
      const result = await saveMedia([save], config, fetchImpl);
      return json(200, { ok: true, record: result.records[0], commit: result.commit });
    }

    if (path === METADATA_BULK_API) {
      if (request.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });
      const saves = parseBulk(await readJson(request));
      const result = await saveMedia(saves, config, fetchImpl);
      return json(200, { ok: true, records: result.records, commit: result.commit });
    }

    if (path === TEXTS_API) {
      if (request.method === "GET") {
        const sources = await loadTextSources(config, fetchImpl);
        return json(200, { ok: true, entries: collectTextEntries(sources) });
      }
      if (request.method === "POST") {
        const payload = parseTextSave(await readJson(request));
        const result = await saveText(payload, config, fetchImpl);
        return json(200, { ok: true, entry: result.entry, commit: result.commit });
      }
      return json(405, { ok: false, error: "Method not allowed" });
    }

    return json(404, { ok: false, error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Media Desk error";
    const conflict = /expectedHeadOid|expected head|branch update/i.test(message);
    return json(conflict ? 409 : 400, { ok: false, error: message });
  }
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex, nofollow, noarchive");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function handleRequest(request, env, fetchImpl = fetch) {
  let config;
  try {
    config = runtimeConfig(env);
  } catch (error) {
    return json(503, {
      ok: false,
      error: error instanceof Error ? error.message : "Media Desk is not configured",
    });
  }

  const url = new URL(request.url);
  const path = url.pathname;

  if (path === LOGIN_PATH || path === LOGIN_PATH.slice(0, -1)) {
    return await authenticated(request, config)
      ? redirect(DESK_PATH)
      : html(200, loginPage());
  }

  if (path === LOGIN_API) return handleLogin(request, config, env);

  if (path === LOGOUT_API) {
    if (request.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });
    if (!sameOrigin(request)) return json(403, { ok: false, error: "Origin rejected" });
    return redirect(LOGIN_PATH, { "set-cookie": expiredSessionCookie() });
  }

  const isAuthenticated = await authenticated(request, config);

  if (path === SESSION_API) {
    return json(isAuthenticated ? 200 : 401, { ok: isAuthenticated });
  }

  if (!isAuthenticated) {
    return path.startsWith("/__media-desk/")
      ? json(401, { ok: false, error: "Authentication required" })
      : redirect(LOGIN_PATH);
  }

  if (path === "/") return redirect(DESK_PATH);

  if (path.startsWith("/__media-desk/")) {
    return apiResponse(request, config, fetchImpl);
  }

  if (path.startsWith("/media/")) {
    return withSecurityHeaders(await proxyMedia(request, config, fetchImpl));
  }

  if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {
    return json(503, { ok: false, error: "Media Desk assets binding is unavailable" });
  }

  return withSecurityHeaders(await env.ASSETS.fetch(request));
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
