#!/usr/bin/env node

const MANAGEMENT_API = "https://api-metrika.yandex.net/management/v1";
const REPORTING_API = "https://api-metrika.yandex.net/stat/v1/data";
const DEFAULT_COUNTER_ID = "112065623";
const DEFAULT_DAYS = 30;

const EXPECTED_GOALS = Object.freeze([
  "project_open",
  "cv_open",
  "contact_email",
  "contact_phone",
  "contact_telegram",
  "download",
]);

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readCounterId() {
  const value = clean(process.env.YANDEX_METRIKA_COUNTER_ID) || DEFAULT_COUNTER_ID;
  if (!/^[1-9]\d*$/.test(value)) throw new Error("YANDEX_METRIKA_COUNTER_ID must be a positive integer.");
  return value;
}

function readToken() {
  const value = clean(process.env.YANDEX_METRIKA_OAUTH_TOKEN);
  if (!value) throw new Error("YANDEX_METRIKA_OAUTH_TOKEN is required in the environment.");
  return value;
}

function parseArgs(argv) {
  const [command = "audit", ...rest] = argv;
  let days = DEFAULT_DAYS;
  let format = "text";

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (arg === "--days") {
      const parsed = Number(rest[index + 1]);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 366) {
        throw new Error("--days must be an integer from 1 to 366.");
      }
      days = parsed;
      index += 1;
      continue;
    }
    if (arg === "--format") {
      const candidate = rest[index + 1];
      if (candidate !== "text" && candidate !== "markdown" && candidate !== "json") {
        throw new Error("--format must be text, markdown, or json.");
      }
      format = candidate;
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") return { command: "help", days, format };
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { command, days, format };
}

async function yandexRequest(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `OAuth ${token}`,
      Accept: "application/json",
      "User-Agent": "looksawful.ru-analytics-audit/1.0",
    },
    signal: AbortSignal.timeout(20_000),
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const apiMessage = payload?.message || payload?.errors?.[0]?.message || response.statusText;
    throw new Error(`Yandex Metrika API ${response.status}: ${apiMessage}`);
  }

  return payload;
}

function normalizeGoal(goal) {
  return {
    id: goal?.id ?? null,
    name: clean(goal?.name),
    type: clean(goal?.type),
    status: clean(goal?.status),
    source: clean(goal?.goal_source),
    conditions: Array.isArray(goal?.conditions)
      ? goal.conditions.map((condition) => ({
          type: clean(condition?.type),
          url: clean(condition?.url),
        }))
      : [],
  };
}

function auditGoals(goals) {
  const normalized = goals.map(normalizeGoal);
  const byActionName = new Map();

  for (const goal of normalized) {
    if (goal.type !== "action") continue;
    for (const condition of goal.conditions) {
      if (condition.url) byActionName.set(condition.url, goal);
    }
  }

  const expected = EXPECTED_GOALS.map((name) => {
    const goal = byActionName.get(name) ?? normalized.find((candidate) => candidate.type === "action" && candidate.name === name);
    return {
      name,
      present: Boolean(goal),
      id: goal?.id ?? null,
      configuredAsAction: goal?.type === "action",
      conditionMatches: Boolean(goal?.conditions.some((condition) => condition.url === name)),
      status: goal?.status || null,
    };
  });

  return {
    expected,
    missing: expected.filter((goal) => !goal.present).map((goal) => goal.name),
    mismatched: expected
      .filter((goal) => goal.present && (!goal.configuredAsAction || !goal.conditionMatches))
      .map((goal) => goal.name),
    all: normalized,
  };
}

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

async function fetchCounter(counterId, token) {
  return yandexRequest(`${MANAGEMENT_API}/counter/${counterId}`, token);
}

async function fetchGoals(counterId, token) {
  const payload = await yandexRequest(`${MANAGEMENT_API}/counter/${counterId}/goals`, token);
  return Array.isArray(payload?.goals) ? payload.goals : [];
}

async function fetchReport(counterId, token, days, goalAudit) {
  const metrics = ["ym:s:visits", "ym:s:users", "ym:s:pageviews"];
  const goalMetrics = goalAudit.expected
    .filter((goal) => Number.isInteger(goal.id))
    .map((goal) => `ym:s:goal${goal.id}visits`);
  metrics.push(...goalMetrics);

  const params = new URLSearchParams({
    ids: counterId,
    date1: isoDateDaysAgo(days - 1),
    date2: "today",
    metrics: metrics.join(","),
    accuracy: "full",
  });

  const payload = await yandexRequest(`${REPORTING_API}?${params}`, token);
  const totals = Array.isArray(payload?.totals) ? payload.totals : [];
  const goalTotals = {};
  goalAudit.expected.filter((goal) => Number.isInteger(goal.id)).forEach((goal, index) => {
    goalTotals[goal.name] = totals[index + 3] ?? 0;
  });

  return {
    days,
    visits: totals[0] ?? 0,
    users: totals[1] ?? 0,
    pageviews: totals[2] ?? 0,
    goals: goalTotals,
    sampled: payload?.sampled === true,
    sampleShare: payload?.sample_share ?? null,
  };
}

function counterSummary(payload, counterId) {
  const counter = payload?.counter ?? {};
  return {
    id: Number(counter.id ?? counterId),
    name: clean(counter.name) || null,
    site: clean(counter.site) || clean(counter.site2?.site) || null,
    status: clean(counter.status) || null,
    webvisor: counter.webvisor ?? null,
  };
}

function printJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printAuditText(result, markdown = false) {
  const prefix = markdown ? "- " : "";
  if (markdown) console.log("## Yandex Metrika audit");
  console.log(`${prefix}Counter: ${result.counter.id}${result.counter.name ? ` (${result.counter.name})` : ""}`);
  console.log(`${prefix}Site: ${result.counter.site ?? "unknown"}`);
  console.log(`${prefix}Status: ${result.counter.status ?? "unknown"}`);
  console.log(`${prefix}Expected goals: ${EXPECTED_GOALS.length}`);
  console.log(`${prefix}Missing goals: ${result.goalAudit.missing.length ? result.goalAudit.missing.join(", ") : "none"}`);
  console.log(`${prefix}Mismatched goals: ${result.goalAudit.mismatched.length ? result.goalAudit.mismatched.join(", ") : "none"}`);
  console.log(`${prefix}${result.report.days}-day visits: ${result.report.visits}`);
  console.log(`${prefix}${result.report.days}-day users: ${result.report.users}`);
  console.log(`${prefix}${result.report.days}-day pageviews: ${result.report.pageviews}`);
  for (const goal of EXPECTED_GOALS) {
    console.log(`${prefix}${result.report.days}-day ${goal}: ${result.report.goals[goal] ?? "not configured"}`);
  }
  console.log(`${prefix}Sampled report: ${result.report.sampled ? `yes${result.report.sampleShare === null ? "" : ` (${result.report.sampleShare})`}` : "no"}`);
}

function printHelp() {
  console.log(`Usage: node tools/yandex-metrika-api.mjs [audit|counter|goals|report] [--days N] [--format text|markdown|json]\n\nEnvironment:\n  YANDEX_METRIKA_OAUTH_TOKEN  OAuth token; required and never printed\n  YANDEX_METRIKA_COUNTER_ID   Counter ID; defaults to ${DEFAULT_COUNTER_ID}\n\nCommands are read-only. No counter or goal mutations are performed.`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.command === "help") {
    printHelp();
    return;
  }
  if (!new Set(["audit", "counter", "goals", "report"]).has(options.command)) {
    throw new Error(`Unknown command: ${options.command}`);
  }

  const counterId = readCounterId();
  const token = readToken();

  if (options.command === "counter") {
    const result = counterSummary(await fetchCounter(counterId, token), counterId);
    options.format === "json" ? printJson(result) : console.log(`${result.id}\t${result.name ?? ""}\t${result.site ?? ""}\t${result.status ?? ""}`);
    return;
  }

  const goals = await fetchGoals(counterId, token);
  const goalAudit = auditGoals(goals);

  if (options.command === "goals") {
    const result = {
      expected: goalAudit.expected,
      missing: goalAudit.missing,
      mismatched: goalAudit.mismatched,
    };
    if (options.format === "json") printJson(result);
    else {
      for (const goal of result.expected) {
        const marker = goal.present && goal.configuredAsAction && goal.conditionMatches ? "OK" : "FAIL";
        console.log(`${marker}\t${goal.name}\t${goal.id ?? "-"}\t${goal.status ?? "-"}`);
      }
    }
    if (result.missing.length || result.mismatched.length) process.exitCode = 2;
    return;
  }

  const report = await fetchReport(counterId, token, options.days, goalAudit);
  if (options.command === "report") {
    options.format === "json" ? printJson(report) : printAuditText({ counter: { id: counterId }, goalAudit, report }, options.format === "markdown");
    return;
  }

  const result = {
    counter: counterSummary(await fetchCounter(counterId, token), counterId),
    goalAudit: {
      expected: goalAudit.expected,
      missing: goalAudit.missing,
      mismatched: goalAudit.mismatched,
    },
    report,
  };

  if (options.format === "json") printJson(result);
  else printAuditText(result, options.format === "markdown");

  if (goalAudit.missing.length || goalAudit.mismatched.length) process.exitCode = 2;
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
