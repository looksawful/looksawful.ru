import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const SITE_ORIGIN = "https://www.looksawful.ru";

const ALL_ACTIONS = new Set([
  "webmaster-status",
  "webmaster-recrawl",
  "webmaster-recrawl-status",
  "metrika-access-check",
  "metrika-summary",
  "metrika-goals",
]);

const PUBLIC_SAFE_ACTIONS = new Set([
  "webmaster-status",
  "webmaster-recrawl",
  "webmaster-recrawl-status",
  "metrika-access-check",
]);

class SafeControlError extends Error {
  constructor(message, code = "CONTROL_ERROR") {
    super(message);
    this.name = "SafeControlError";
    this.code = code;
  }
}

export function isPublicSafeAction(action) {
  return PUBLIC_SAFE_ACTIONS.has(action);
}

export function parseIssueCommand(title, body = "") {
  const match = /^\[yandex-control\] ([a-z0-9-]+)$/.exec(String(title).trim());
  if (!match) {
    throw new SafeControlError(
      "invalid Yandex control title",
      "INVALID_CONTROL_TITLE",
    );
  }

  const action = match[1];
  if (!ALL_ACTIONS.has(action)) {
    throw new SafeControlError(
      `unsupported Yandex control action: ${action}`,
      "UNSUPPORTED_CONTROL_ACTION",
    );
  }

  const source = String(body ?? "").trim();
  if (!source) {
    return { action, payload: {} };
  }

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

function encodePath(value) {
  return encodeURIComponent(String(value));
}

function safeErrorCode(value) {
  return typeof value === "string" && /^[A-Z0-9_]{2,80}$/.test(value)
    ? value
    : null;
}

async function requestJson(url, { token, method = "GET", body } = {}) {
  const headers = {
    Accept: "application/json",
    Authorization: `OAuth ${token}`,
  };
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
      code = safeErrorCode(error?.error_code);
    } catch {
      // Raw API error bodies are deliberately never copied into public logs.
    }
    const suffix = code ? `, ${code}` : "";
    throw new SafeControlError(
      `Yandex API request failed (HTTP ${response.status}${suffix})`,
      "YANDEX_API_ERROR",
    );
  }

  if (response.status === 204) {
    return {};
  }

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
  const user = await requestJson("https://api.webmaster.yandex.net/v4/user", {
    token,
  });
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

  let host = entries.find(
    (entry) => normalizeSiteUrl(entry?.ascii_host_url) === target,
  );

  if (!host) {
    const mirrored = entries.find(
      (entry) =>
        normalizeSiteUrl(entry?.main_mirror?.ascii_host_url) === target,
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

function presentProblems(problems) {
  const entries = Object.entries(problems ?? {}).filter(
    ([, problem]) => problem?.state === "PRESENT",
  );

  return { entries };
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

  const problems = presentProblems(diagnostics?.problems);
  const problemItems = problems.entries.map(
    ([name, problem]) => `${name}: ${problem.severity}`,
  );

  return [
    "### Yandex Webmaster",
    "",
    `- Сайт: ${SITE_ORIGIN}/`,
    `- Права подтверждены: ${host?.verified === true ? "да" : "нет"}`,
    `- Статус данных: ${host?.host_data_status ?? "UNKNOWN"}`,
    `- Проблем сейчас: ${problems.entries.length}`,
    `- Квота переобхода: ${quota?.quota_remainder ?? "?"}/${quota?.daily_quota ?? "?"}`,
    "",
    "Проблемы со статусом `PRESENT`:",
    markdownList(problemItems),
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
    "",
    "Внутренний task id намеренно не публикуется в открытом репозитории.",
  ].join("\n");
}

function samePublicSite(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "www.looksawful.ru" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

async function webmasterRecrawlStatus(token) {
  const context = await resolveWebmasterContext(token);
  const base = webmasterBase(context);
  const queue = await requestJson(`${base}/recrawl/queue?offset=0&limit=10`, {
    token,
  });
  const tasks = Array.isArray(queue?.tasks)
    ? queue.tasks
    : Array.isArray(queue?.recrawl_tasks)
      ? queue.recrawl_tasks
      : [];

  const publicTasks = tasks
    .filter((task) => samePublicSite(task?.url))
    .slice(0, 10)
    .map((task) => {
      const when = task?.added_time ? `, ${task.added_time}` : "";
      return `${task.url}: ${task?.status ?? "UNKNOWN"}${when}`;
    });

  return [
    "### Yandex Webmaster: последние задачи переобхода",
    "",
    markdownList(publicTasks),
  ].join("\n");
}

async function metrikaAccessCheck(token) {
  const counterId = requireEnv("YANDEX_METRIKA_COUNTER_ID");
  const data = await requestJson(
    `https://api-metrika.yandex.net/management/v1/counter/${encodePath(counterId)}`,
    { token },
  );

  if (!data?.counter || String(data.counter.id) !== String(counterId)) {
    throw new SafeControlError(
      "Yandex Metrika counter is not available to this token",
      "METRIKA_COUNTER_UNAVAILABLE",
    );
  }

  return [
    "### Yandex Metrika",
    "",
    `- Счётчик ${counterId} доступен через OAuth: да`,
    "- Приватная статистика намеренно не выводится в открытый GitHub.",
  ].join("\n");
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
  if (process.env.YANDEX_CONTROL_PRIVATE_OUTPUT !== "1") {
    throw new SafeControlError(
      "Metrika reports require a private result channel",
      "PRIVATE_OUTPUT_REQUIRED",
    );
  }

  const counterId = requireEnv("YANDEX_METRIKA_COUNTER_ID");
  const days = parseDays(payload);
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const query = new URLSearchParams({
    ids: counterId,
    metrics: "ym:s:visits,ym:s:users,ym:s:pageviews",
    date1: isoDate(start),
    date2: isoDate(end),
    accuracy: "full",
  });

  const data = await requestJson(
    `https://api-metrika.yandex.net/stat/v1/data?${query}`,
    { token },
  );
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
  if (process.env.YANDEX_CONTROL_PRIVATE_OUTPUT !== "1") {
    throw new SafeControlError(
      "Metrika goals require a private result channel",
      "PRIVATE_OUTPUT_REQUIRED",
    );
  }

  const counterId = requireEnv("YANDEX_METRIKA_COUNTER_ID");
  const data = await requestJson(
    `https://api-metrika.yandex.net/management/v1/counter/${encodePath(counterId)}/goals`,
    { token },
  );
  const goals = Array.isArray(data?.goals) ? data.goals : [];
  const rows = goals.map(
    (goal) =>
      `${goal?.name ?? "(без имени)"}: ${goal?.type ?? "UNKNOWN"}${goal?.status ? `, ${goal.status}` : ""}`,
  );

  return [
    "### Yandex Metrika: цели",
    "",
    `Всего: ${goals.length}`,
    "",
    markdownList(rows),
  ].join("\n");
}

export async function executeControlAction({ action, payload, token }) {
  const publicMode = process.env.YANDEX_CONTROL_PRIVATE_OUTPUT !== "1";
  if (publicMode && !isPublicSafeAction(action)) {
    throw new SafeControlError(
      "this action requires a private result channel",
      "PRIVATE_OUTPUT_REQUIRED",
    );
  }

  switch (action) {
    case "webmaster-status":
      return webmasterStatus(token);
    case "webmaster-recrawl":
      return webmasterRecrawl(token, payload);
    case "webmaster-recrawl-status":
      return webmasterRecrawlStatus(token);
    case "metrika-access-check":
      return metrikaAccessCheck(token);
    case "metrika-summary":
      return metrikaSummary(token, payload);
    case "metrika-goals":
      return metrikaGoals(token);
    default:
      throw new SafeControlError(
        `unsupported Yandex control action: ${action}`,
        "UNSUPPORTED_CONTROL_ACTION",
      );
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
  const code =
    error instanceof SafeControlError ? error.code : "UNEXPECTED_CONTROL_ERROR";
  const message =
    error instanceof SafeControlError
      ? error.message
      : "unexpected Yandex control failure";

  return [
    "### Yandex Control: ошибка",
    "",
    `- Код: \`${code}\``,
    `- Сообщение: ${message}`,
    "",
    "OAuth-токены, HTTP-заголовки и сырые ответы API в отчёт не выводятся.",
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
if (invokedPath === import.meta.url) {
  await main();
}
