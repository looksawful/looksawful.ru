import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const SITE_ORIGIN = "https://www.looksawful.ru";

const ACTION_RISK = new Map([
  ["webmaster-status", "read"],
  ["webmaster-recrawl", "write"],
  ["webmaster-recrawl-status", "read"],
  ["webmaster-sitemaps", "read"],
  ["webmaster-sitemap-add", "write"],
  ["webmaster-sitemap-delete", "destructive"],
  ["metrika-access-check", "read"],
  ["metrika-summary", "read"],
  ["metrika-goals", "read"],
  ["metrika-counter", "read"],
  ["metrika-goal-create", "write"],
  ["metrika-goal-update", "write"],
  ["metrika-goal-delete", "destructive"],
  ["disk-info", "read"],
  ["disk-list", "read"],
  ["disk-mkdir", "write"],
  ["disk-move", "write"],
  ["disk-copy", "write"],
  ["disk-delete", "destructive"],
  ["cloud-inventory", "read"],
]);

const ALL_ACTIONS = new Set(ACTION_RISK.keys());

const PUBLIC_SAFE_ACTIONS = new Set([
  "webmaster-status",
  "webmaster-recrawl",
  "webmaster-recrawl-status",
  "webmaster-sitemaps",
  "webmaster-sitemap-add",
  "metrika-access-check",
]);

const SUPPORTED_METRIKA_GOAL_TYPES = new Set([
  "action",
  "url",
  "number",
  "step",
  "regexp",
  "contain",
  "exact",
  "phone",
  "email",
  "messenger",
  "social",
  "search",
  "file",
  "payment_system",
  "duration",
  "composite",
]);

class SafeControlError extends Error {
  constructor(message, code = "CONTROL_ERROR") {
    super(message);
    this.name = "SafeControlError";
    this.code = code;
  }
}

export function classifyAction(action) {
  const risk = ACTION_RISK.get(action);
  if (!risk) {
    throw new SafeControlError(
      `unsupported Yandex control action: ${action}`,
      "UNSUPPORTED_CONTROL_ACTION",
    );
  }
  return risk;
}

export function requiresConfirmation(action) {
  return classifyAction(action) === "destructive";
}

export function isPublicSafeAction(action) {
  return PUBLIC_SAFE_ACTIONS.has(action);
}

export function parseIssueCommand(title, body = "") {
  const match = /^\[yandex-control\] ([a-z0-9-]+)$/.exec(String(title).trim());
  if (!match) {
    throw new SafeControlError("invalid Yandex control title", "INVALID_CONTROL_TITLE");
  }

  const action = match[1];
  if (!ALL_ACTIONS.has(action)) {
    throw new SafeControlError(
      `unsupported Yandex control action: ${action}`,
      "UNSUPPORTED_CONTROL_ACTION",
    );
  }

  const source = String(body ?? "").trim();
  if (!source) return { action, payload: {} };

  let payload;
  try {
    payload = JSON.parse(source);
  } catch {
    throw new SafeControlError(
      "Yandex control body must be valid JSON",
      "INVALID_CONTROL_PAYLOAD",
    );
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    throw new SafeControlError(
      "Yandex control body must be a JSON object",
      "INVALID_CONTROL_PAYLOAD",
    );
  }

  return { action, payload };
}

export function assertAllowedSiteUrl(value) {
  let url;
  try {
    url = new URL(String(value));
  } catch {
    throw new SafeControlError("recrawl URL is invalid", "INVALID_URL");
  }

  if (url.protocol !== "https:") {
    throw new SafeControlError("recrawl URL must use HTTPS", "INVALID_URL");
  }
  if (url.hostname !== "www.looksawful.ru" || url.port) {
    throw new SafeControlError(
      "recrawl URL must belong to www.looksawful.ru",
      "INVALID_URL",
    );
  }
  if (url.username || url.password) {
    throw new SafeControlError(
      "recrawl URL must not contain credentials",
      "INVALID_URL",
    );
  }
  if (url.hash) {
    throw new SafeControlError(
      "recrawl URL must not contain a fragment",
      "INVALID_URL",
    );
  }

  return url.href;
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new SafeControlError(
      `required runtime setting is missing: ${name}`,
      "MISSING_RUNTIME_SETTING",
    );
  }
  return value;
}

function optionalEnv(name) {
  return process.env[name]?.trim() || null;
}

function encodePath(value) {
  return encodeURIComponent(String(value));
}

function safeErrorCode(value) {
  return typeof value === "string" && /^[A-Z0-9_]{2,80}$/.test(value)
    ? value
    : null;
}

async function requestJson(
  url,
  { token, method = "GET", body, auth = "OAuth", headers: extraHeaders = {} } = {},
) {
  const headers = { Accept: "application/json", ...extraHeaders };
  if (token) headers.Authorization = `${auth} ${token}`;
  const options = { method, headers };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new SafeControlError(
      "Yandex API network request failed",
      "YANDEX_NETWORK_ERROR",
    );
  }

  if (!response.ok) {
    let code = null;
    try {
      const error = await response.json();
      code = safeErrorCode(error?.error_code) || safeErrorCode(error?.code);
    } catch {
      // Raw provider responses are deliberately never copied into public logs.
    }
    const suffix = code ? `, ${code}` : "";
    throw new SafeControlError(
      `Yandex API request failed (HTTP ${response.status}${suffix})`,
      "YANDEX_API_ERROR",
    );
  }

  if (response.status === 204) return {};

  try {
    return await response.json();
  } catch {
    throw new SafeControlError(
      "Yandex API returned a non-JSON response",
      "YANDEX_INVALID_RESPONSE",
    );
  }
}

function normalizeSiteUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}

async function resolveWebmasterContext(token) {
  const user = await requestJson("https://api.webmaster.yandex.net/v4/user", { token });
  const userId = user?.user_id;
  if (userId === undefined || userId === null) {
    throw new SafeControlError(
      "Yandex Webmaster did not return a user id",
      "WEBMASTER_USER_UNAVAILABLE",
    );
  }

  const hosts = await requestJson(
    `https://api.webmaster.yandex.net/v4/user/${encodePath(userId)}/hosts`,
    { token },
  );
  const entries = Array.isArray(hosts?.hosts) ? hosts.hosts : [];
  const target = `${SITE_ORIGIN}/`;

  let host = entries.find((entry) => normalizeSiteUrl(entry?.ascii_host_url) === target);
  if (!host) {
    const mirrored = entries.find(
      (entry) => normalizeSiteUrl(entry?.main_mirror?.ascii_host_url) === target,
    );
    if (mirrored?.main_mirror?.host_id) {
      host = {
        ...mirrored.main_mirror,
        verified: mirrored.main_mirror.verified ?? mirrored.verified,
      };
    }
  }

  if (!host?.host_id) {
    throw new SafeControlError(
      "www.looksawful.ru is not available to this Yandex Webmaster token",
      "WEBMASTER_HOST_UNAVAILABLE",
    );
  }
  if (host.verified !== true) {
    throw new SafeControlError(
      "www.looksawful.ru is not verified for this Yandex Webmaster token",
      "WEBMASTER_HOST_NOT_VERIFIED",
    );
  }

  return { userId, hostId: host.host_id };
}

function webmasterBase({ userId, hostId }) {
  return `https://api.webmaster.yandex.net/v4/user/${encodePath(userId)}/hosts/${encodePath(hostId)}`;
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : "- нет";
}

async function webmasterStatus(token) {
  const context = await resolveWebmasterContext(token);
  const base = webmasterBase(context);
  const [host, diagnostics, quota] = await Promise.all([
    requestJson(base, { token }),
    requestJson(`${base}/diagnostics`, { token }),
    requestJson(`${base}/recrawl/quota`, { token }),
  ]);
  const problems = Object.entries(diagnostics?.problems ?? {}).filter(
    ([, problem]) => problem?.state === "PRESENT",
  );
  return [
    "### Yandex Webmaster",
    "",
    `- Сайт: ${SITE_ORIGIN}/`,
    `- Права подтверждены: ${host?.verified === true ? "да" : "нет"}`,
    `- Статус данных: ${host?.host_data_status ?? "UNKNOWN"}`,
    `- Проблем сейчас: ${problems.length}`,
    `- Квота переобхода: ${quota?.quota_remainder ?? "?"}/${quota?.daily_quota ?? "?"}`,
    "",
    "Проблемы со статусом `PRESENT`:",
    markdownList(problems.map(([name, problem]) => `${name}: ${problem.severity}`)),
  ].join("\n");
}

async function webmasterRecrawl(token, payload) {
  const url = assertAllowedSiteUrl(payload?.url ?? `${SITE_ORIGIN}/`);
  const context = await resolveWebmasterContext(token);
  const base = webmasterBase(context);
  const quota = await requestJson(`${base}/recrawl/quota`, { token });
  const remainder = Number(quota?.quota_remainder);
  if (!Number.isFinite(remainder) || remainder <= 0) {
    throw new SafeControlError(
      "Yandex Webmaster recrawl quota is exhausted",
      "WEBMASTER_RECRAWL_QUOTA_EXHAUSTED",
    );
  }
  const result = await requestJson(`${base}/recrawl/queue`, {
    token,
    method: "POST",
    body: { url },
  });
  return [
    "### Yandex Webmaster: переобход",
    "",
    `- URL: ${url}`,
    "- Запрос принят: да",
    `- Остаток квоты: ${result?.quota_remainder ?? "?"}`,
  ].join("\n");
}

function samePublicSite(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.looksawful.ru" && !url.username && !url.password;
  } catch {
    return false;
  }
}

async function webmasterRecrawlStatus(token) {
  const context = await resolveWebmasterContext(token);
  const base = webmasterBase(context);
  const queue = await requestJson(`${base}/recrawl/queue?offset=0&limit=10`, { token });
  const tasks = Array.isArray(queue?.tasks)
    ? queue.tasks
    : Array.isArray(queue?.recrawl_tasks)
      ? queue.recrawl_tasks
      : [];
  const publicTasks = tasks
    .filter((task) => samePublicSite(task?.url))
    .slice(0, 10)
    .map((task) => `${task.url}: ${task?.status ?? "UNKNOWN"}${task?.added_time ? `, ${task.added_time}` : ""}`);
  return ["### Yandex Webmaster: последние задачи переобхода", "", markdownList(publicTasks)].join("\n");
}

async function webmasterSitemaps(token) {
  const context = await resolveWebmasterContext(token);
  const base = webmasterBase(context);
  const data = await requestJson(`${base}/sitemaps?limit=100`, { token });
  const sitemaps = Array.isArray(data?.sitemaps) ? data.sitemaps : [];
  const rows = sitemaps
    .filter((item) => samePublicSite(item?.sitemap_url))
    .map((item) => `${item.sitemap_url}: ${item.errors_count ?? 0} ошибок, ${item.urls_count ?? "?"} URL`);
  return ["### Yandex Webmaster: Sitemap", "", markdownList(rows)].join("\n");
}

async function webmasterSitemapAdd(token, payload) {
  const sitemapUrl = assertAllowedSiteUrl(payload?.url ?? `${SITE_ORIGIN}/sitemap.xml`);
  const context = await resolveWebmasterContext(token);
  const base = webmasterBase(context);
  await requestJson(`${base}/user-added-sitemaps`, {
    token,
    method: "POST",
    body: { url: sitemapUrl },
  });
  return `### Yandex Webmaster: Sitemap\n\n- Добавлен: ${sitemapUrl}`;
}

async function webmasterSitemapDelete(token, payload) {
  const sitemapId = String(payload?.sitemapId ?? "").trim();
  if (!/^[A-Za-z0-9:_-]{1,200}$/.test(sitemapId)) {
    throw new SafeControlError("invalid sitemap id", "INVALID_SITEMAP_ID");
  }
  const context = await resolveWebmasterContext(token);
  const base = webmasterBase(context);
  await requestJson(`${base}/user-added-sitemaps/${encodePath(sitemapId)}`, {
    token,
    method: "DELETE",
  });
  return "### Yandex Webmaster: Sitemap\n\n- Удаление подтверждено API.";
}

function counterId() {
  return requireEnv("YANDEX_METRIKA_COUNTER_ID");
}

function metrikaBase() {
  return `https://api-metrika.yandex.net/management/v1/counter/${encodePath(counterId())}`;
}

async function metrikaAccessCheck(token) {
  const id = counterId();
  const data = await requestJson(metrikaBase(), { token });
  if (!data?.counter || String(data.counter.id) !== String(id)) {
    throw new SafeControlError(
      "Yandex Metrika counter is not available to this token",
      "METRIKA_COUNTER_UNAVAILABLE",
    );
  }
  return `### Yandex Metrika\n\n- Счётчик ${id} доступен через OAuth: да\n- Приватная статистика не публикуется.`;
}

function parseDays(payload) {
  const days = Number(payload?.days ?? 7);
  if (!Number.isInteger(days) || days < 1 || days > 90) {
    throw new SafeControlError(
      "Metrika days must be an integer from 1 to 90",
      "INVALID_METRIKA_PERIOD",
    );
  }
  return days;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

async function metrikaSummary(token, payload) {
  const id = counterId();
  const days = parseDays(payload);
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const query = new URLSearchParams({
    ids: id,
    metrics: "ym:s:visits,ym:s:users,ym:s:pageviews",
    date1: isoDate(start),
    date2: isoDate(end),
    accuracy: "full",
  });
  const data = await requestJson(`https://api-metrika.yandex.net/stat/v1/data?${query}`, { token });
  const totals = Array.isArray(data?.totals) ? data.totals : [];
  return [
    `### Yandex Metrika: ${days} дней`,
    "",
    `- Визиты: ${totals[0] ?? "?"}`,
    `- Посетители: ${totals[1] ?? "?"}`,
    `- Просмотры: ${totals[2] ?? "?"}`,
    `- Семплирование: ${data?.sampled ? "да" : "нет"}`,
  ].join("\n");
}

async function metrikaGoals(token) {
  const data = await requestJson(`${metrikaBase()}/goals`, { token });
  const goals = Array.isArray(data?.goals) ? data.goals : [];
  const rows = goals.map((goal) => `${goal?.id ?? "?"} ${goal?.name ?? "(без имени)"}: ${goal?.type ?? "UNKNOWN"}`);
  return ["### Yandex Metrika: цели", "", `Всего: ${goals.length}`, "", markdownList(rows)].join("\n");
}

async function metrikaCounter(token) {
  const data = await requestJson(metrikaBase(), { token });
  const counter = data?.counter ?? {};
  return [
    "### Yandex Metrika: счётчик",
    "",
    `- ID: ${counter.id ?? "?"}`,
    `- Имя: ${counter.name ?? "?"}`,
    `- Сайт: ${counter.site ?? "?"}`,
    `- Статус: ${counter.status ?? "?"}`,
  ].join("\n");
}

export function validateMetrikaGoalPayload(value) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    throw new SafeControlError("Metrika goal must be an object", "INVALID_METRIKA_GOAL");
  }
  const name = String(value.name ?? "").trim();
  if (!name || name.length > 255) {
    throw new SafeControlError("invalid Metrika goal name", "INVALID_METRIKA_GOAL");
  }
  const type = String(value.type ?? "").trim();
  if (!SUPPORTED_METRIKA_GOAL_TYPES.has(type)) {
    throw new SafeControlError("unsupported Metrika goal type", "INVALID_METRIKA_GOAL");
  }
  const goal = { ...value, name, type };
  delete goal.id;
  delete goal.goal_source;
  delete goal.status;
  return goal;
}

async function metrikaGoalCreate(token, payload) {
  const goal = validateMetrikaGoalPayload(payload?.goal ?? payload);
  await requestJson(`${metrikaBase()}/goals`, {
    token,
    method: "POST",
    body: { goal },
  });
  return `### Yandex Metrika: цель\n\n- Создана: ${goal.name}`;
}

function parseGoalId(payload) {
  const id = String(payload?.goalId ?? payload?.id ?? "").trim();
  if (!/^\d+$/.test(id)) {
    throw new SafeControlError("invalid Metrika goal id", "INVALID_METRIKA_GOAL_ID");
  }
  return id;
}

async function metrikaGoalUpdate(token, payload) {
  const id = parseGoalId(payload);
  const goal = validateMetrikaGoalPayload(payload?.goal);
  await requestJson(`${metrikaBase()}/goal/${encodePath(id)}`, {
    token,
    method: "PUT",
    body: { goal },
  });
  return `### Yandex Metrika: цель\n\n- Обновлена: ${goal.name}`;
}

async function metrikaGoalDelete(token, payload) {
  const id = parseGoalId(payload);
  await requestJson(`${metrikaBase()}/goal/${encodePath(id)}`, {
    token,
    method: "DELETE",
  });
  return "### Yandex Metrika: цель\n\n- Удаление подтверждено API.";
}

export function validateDiskPath(value) {
  const root = optionalEnv("YANDEX_DISK_ROOT") || "/looksawful";
  const source = String(value ?? "").trim();
  const plain = source.startsWith("disk:") ? source.slice(5) : source;
  if (!plain.startsWith("/")) {
    throw new SafeControlError("Yandex Disk path must be absolute", "INVALID_DISK_PATH");
  }
  if (plain.split("/").includes("..")) {
    throw new SafeControlError("Yandex Disk path traversal is forbidden", "INVALID_DISK_PATH");
  }
  const normalizedRoot = root.endsWith("/") ? root.slice(0, -1) : root;
  if (plain !== normalizedRoot && !plain.startsWith(`${normalizedRoot}/`)) {
    throw new SafeControlError(
      `Yandex Disk path must stay inside ${normalizedRoot}`,
      "INVALID_DISK_PATH",
    );
  }
  return source;
}

function diskUrl(path = "") {
  return `https://cloud-api.yandex.net/v1/disk${path}`;
}

async function diskInfo(token) {
  const data = await requestJson(diskUrl(), { token });
  return [
    "### Yandex Disk",
    "",
    `- Всего: ${data.total_space ?? "?"}`,
    `- Использовано: ${data.used_space ?? "?"}`,
    `- Корзина: ${data.trash_size ?? "?"}`,
  ].join("\n");
}

async function diskList(token, payload) {
  const path = validateDiskPath(payload?.path ?? optionalEnv("YANDEX_DISK_ROOT") ?? "/looksawful");
  const query = new URLSearchParams({ path, limit: "100" });
  const data = await requestJson(`${diskUrl("/resources")}?${query}`, { token });
  const items = Array.isArray(data?._embedded?.items) ? data._embedded.items : [];
  const rows = items.map((item) => `${item.type ?? "?"}: ${item.name ?? "?"}`);
  return ["### Yandex Disk: список", "", `- Путь: ${path}`, "", markdownList(rows)].join("\n");
}

async function diskMkdir(token, payload) {
  const path = validateDiskPath(payload?.path);
  const query = new URLSearchParams({ path });
  await requestJson(`${diskUrl("/resources")}?${query}`, { token, method: "PUT" });
  return `### Yandex Disk\n\n- Папка создана: ${path}`;
}

async function diskTransfer(token, payload, kind) {
  const from = validateDiskPath(payload?.from);
  const path = validateDiskPath(payload?.path);
  const query = new URLSearchParams({ from, path, overwrite: payload?.overwrite === true ? "true" : "false" });
  await requestJson(`${diskUrl(`/resources/${kind}`)}?${query}`, { token, method: "POST" });
  return `### Yandex Disk\n\n- ${kind === "move" ? "Перемещено" : "Скопировано"}: ${from} → ${path}`;
}

async function diskDelete(token, payload) {
  const path = validateDiskPath(payload?.path);
  const query = new URLSearchParams({ path, permanently: payload?.permanently === true ? "true" : "false" });
  await requestJson(`${diskUrl("/resources")}?${query}`, { token, method: "DELETE" });
  return `### Yandex Disk\n\n- Удаление подтверждено API: ${path}`;
}

async function createCloudIamToken(oauthToken) {
  const data = await requestJson("https://iam.api.cloud.yandex.net/iam/v1/tokens", {
    method: "POST",
    body: { yandexPassportOauthToken: oauthToken },
  });
  const iamToken = data?.iamToken;
  if (!iamToken) {
    throw new SafeControlError("Yandex Cloud IAM token was not issued", "CLOUD_IAM_UNAVAILABLE");
  }
  return iamToken;
}

async function cloudInventory(oauthToken) {
  const iamToken = await createCloudIamToken(oauthToken);
  let clouds;
  const configuredCloudId = optionalEnv("YANDEX_CLOUD_ID");
  if (configuredCloudId) {
    clouds = { clouds: [await requestJson(`https://resource-manager.api.cloud.yandex.net/resource-manager/v1/clouds/${encodePath(configuredCloudId)}`, { token: iamToken, auth: "Bearer" })] };
  } else {
    clouds = await requestJson("https://resource-manager.api.cloud.yandex.net/resource-manager/v1/clouds?pageSize=100", { token: iamToken, auth: "Bearer" });
  }
  const entries = Array.isArray(clouds?.clouds) ? clouds.clouds : [];
  const configuredFolderId = optionalEnv("YANDEX_CLOUD_FOLDER_ID");
  const folders = [];
  if (configuredFolderId) {
    folders.push(await requestJson(`https://resource-manager.api.cloud.yandex.net/resource-manager/v1/folders/${encodePath(configuredFolderId)}`, { token: iamToken, auth: "Bearer" }));
  } else {
    for (const cloud of entries.slice(0, 10)) {
      if (!cloud?.id) continue;
      const query = new URLSearchParams({ cloudId: cloud.id, pageSize: "100" });
      const data = await requestJson(`https://resource-manager.api.cloud.yandex.net/resource-manager/v1/folders?${query}`, { token: iamToken, auth: "Bearer" });
      if (Array.isArray(data?.folders)) folders.push(...data.folders);
    }
  }
  return [
    "### Yandex Cloud",
    "",
    `- Облаков: ${entries.length}`,
    `- Папок: ${folders.length}`,
    "",
    "Облака:",
    markdownList(entries.map((cloud) => `${cloud.name ?? "?"} (${cloud.status ?? "?"})`)),
    "",
    "Папки:",
    markdownList(folders.map((folder) => `${folder.name ?? "?"} (${folder.status ?? "?"})`)),
  ].join("\n");
}

function assertDestructiveConfirmation(action, payload) {
  if (!requiresConfirmation(action)) return;
  if (payload?.confirm !== action) {
    throw new SafeControlError(
      `destructive action requires payload.confirm = ${action}`,
      "CONFIRMATION_REQUIRED",
    );
  }
}

export async function executeControlAction({ action, payload, token }) {
  const risk = classifyAction(action);
  const publicMode = process.env.YANDEX_CONTROL_PRIVATE_OUTPUT !== "1";
  if (publicMode && risk === "read" && !isPublicSafeAction(action)) {
    throw new SafeControlError(
      "this read action requires a private result channel",
      "PRIVATE_OUTPUT_REQUIRED",
    );
  }
  assertDestructiveConfirmation(action, payload);

  switch (action) {
    case "webmaster-status": return webmasterStatus(token);
    case "webmaster-recrawl": return webmasterRecrawl(token, payload);
    case "webmaster-recrawl-status": return webmasterRecrawlStatus(token);
    case "webmaster-sitemaps": return webmasterSitemaps(token);
    case "webmaster-sitemap-add": return webmasterSitemapAdd(token, payload);
    case "webmaster-sitemap-delete": return webmasterSitemapDelete(token, payload);
    case "metrika-access-check": return metrikaAccessCheck(token);
    case "metrika-summary": return metrikaSummary(token, payload);
    case "metrika-goals": return metrikaGoals(token);
    case "metrika-counter": return metrikaCounter(token);
    case "metrika-goal-create": return metrikaGoalCreate(token, payload);
    case "metrika-goal-update": return metrikaGoalUpdate(token, payload);
    case "metrika-goal-delete": return metrikaGoalDelete(token, payload);
    case "disk-info": return diskInfo(token);
    case "disk-list": return diskList(token, payload);
    case "disk-mkdir": return diskMkdir(token, payload);
    case "disk-move": return diskTransfer(token, payload, "move");
    case "disk-copy": return diskTransfer(token, payload, "copy");
    case "disk-delete": return diskDelete(token, payload);
    case "cloud-inventory": return cloudInventory(token);
    default:
      throw new SafeControlError(`unsupported Yandex control action: ${action}`, "UNSUPPORTED_CONTROL_ACTION");
  }
}

async function writeResult(path, content) {
  if (!path) {
    process.stdout.write(`${content}\n`);
    return;
  }
  await writeFile(path, `${content.trim()}\n`, "utf8");
}

function safeFailureMarkdown(error) {
  const code = error instanceof SafeControlError ? error.code : "UNEXPECTED_CONTROL_ERROR";
  const message = error instanceof SafeControlError ? error.message : "unexpected Yandex control failure";
  return [
    "### Yandex Control: ошибка",
    "",
    `- Код: \`${code}\``,
    `- Сообщение: ${message}`,
    "",
    "OAuth/IAM-токены, HTTP-заголовки и сырые ответы API в отчёт не выводятся.",
  ].join("\n");
}

export async function main() {
  const resultPath = process.env.YANDEX_CONTROL_RESULT_PATH;
  try {
    const token = requireEnv("YANDEX_OAUTH_TOKEN");
    const { action, payload } = parseIssueCommand(
      requireEnv("YANDEX_CONTROL_TITLE"),
      process.env.YANDEX_CONTROL_BODY ?? "",
    );
    const result = await executeControlAction({ action, payload, token });
    await writeResult(resultPath, result);
  } catch (error) {
    await writeResult(resultPath, safeFailureMarkdown(error));
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (invokedPath === import.meta.url) await main();
