import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPortfolioPetKnowledgeCandidates } from "../src/features/portfolio-pet/knowledge.ts";

const DEFAULT_MODEL_URI = "gpt://b1gccfh8f63ut5b9eogf/yandexgpt-5-lite/latest";
const YANDEX_URL = "https://ai.api.cloud.yandex.net/foundationModels/v1/completion";

function publicSources() {
  return Object.fromEntries(
    buildPortfolioPetKnowledgeCandidates().map((candidate) => [candidate.id, {
      id: candidate.id,
      title: candidate.title ?? "",
      text: candidate.text,
    }]),
  );
}

const WORKER_BODY = String.raw`
const json = (status, payload) => new Response(JSON.stringify(payload), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});

function parseInput(value) {
  if (!value || typeof value !== "object") return null;
  const message = typeof value.message === "string" ? value.message.trim() : "";
  const locale = value.locale === "en" ? "en" : value.locale === "ru" ? "ru" : null;
  const sessionId = typeof value.sessionId === "string" ? value.sessionId.trim() : "";
  const context = value.context && typeof value.context === "object" ? value.context : null;
  const sourceIds = Array.isArray(context?.sourceIds)
    ? [...new Set(context.sourceIds.filter((item) => typeof item === "string"))].slice(0, 12)
    : [];
  if (!message || message.length > 2000 || !locale || !sessionId || sessionId.length > 128) return null;
  return { message, locale, sourceIds };
}

function buildContext(sourceIds) {
  return sourceIds
    .map((id) => SOURCES[id])
    .filter(Boolean)
    .map((source) => {
      const title = source.title ? " | " + source.title : "";
      return "[" + source.id + title + "]\n" + source.text;
    })
    .join("\n\n")
    .slice(0, 12000);
}

function systemPrompt(locale, context) {
  const rules = locale === "ru"
    ? [
        "Ты Awful, AI-помощник портфолио Ивана Крушинского.",
        "Отвечай по-русски, кратко и по существу о работе, опыте, навыках и проектах Ивана.",
        "Используй только факты из CONTEXT. Не придумывай клиентов, даты, метрики, роли, технологии или результаты.",
        "Если CONTEXT недостаточно, прямо скажи об этом и предложи воспользоваться формой связи.",
        "Ты не Иван и не должна выдавать себя за него.",
      ]
    : [
        "You are Awful, the AI assistant for Ivan Krushinsky's portfolio.",
        "Answer in English, briefly and directly, about Ivan's work, experience, skills and projects.",
        "Use only facts from CONTEXT. Never invent clients, dates, metrics, roles, technologies or results.",
        "If the context is insufficient, say that clearly and suggest using the contact form.",
        "You are not Ivan and must not impersonate him.",
      ];
  return rules.join("\n") + "\n\nCONTEXT\n" + context;
}

async function callYandex(input, env, context) {
  const key = String(env.YANDEX_AI_API_KEY || "").trim();
  if (!key) return { kind: "unavailable" };
  const modelUri = String(env.YANDEX_AI_MODEL_URI || DEFAULT_MODEL_URI).trim() || DEFAULT_MODEL_URI;
  const response = await fetch(YANDEX_URL, {
    method: "POST",
    headers: { Authorization: "Api-Key " + key, "Content-Type": "application/json" },
    body: JSON.stringify({
      modelUri,
      completionOptions: { stream: false, temperature: 0.2, maxTokens: "320" },
      messages: [
        { role: "system", text: systemPrompt(input.locale, context) },
        { role: "user", text: input.message },
      ],
    }),
  });
  if (response.status === 429) return { kind: "rate_limited" };
  if (!response.ok) return { kind: "unavailable" };
  let payload;
  try { payload = await response.json(); } catch { return { kind: "unavailable" }; }
  const text = payload?.result?.alternatives?.[0]?.message?.text;
  if (typeof text !== "string" || !text.trim()) return { kind: "unavailable" };
  return { kind: "answer", text: text.trim() };
}

async function handleApi(request, env) {
  if (request.method !== "POST") return json(405, { kind: "unavailable" });
  let input;
  try { input = parseInput(await request.json()); } catch { input = null; }
  if (!input) return json(400, { kind: "unavailable" });
  const selectedIds = input.sourceIds.filter((id) => Object.hasOwn(SOURCES, id));
  const context = buildContext(selectedIds);
  if (!context) return json(200, { kind: "no_data", text: "", sources: [] });
  try {
    const result = await callYandex(input, env, context);
    if (result.kind === "rate_limited") return json(429, result);
    if (result.kind !== "answer") return json(503, { kind: "unavailable" });
    return json(200, { kind: "answer", text: result.text, sources: selectedIds });
  } catch {
    return json(503, { kind: "unavailable" });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/portfolio-chat") return handleApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
`;

export async function buildPreviewAssistantWorkerSource() {
  const prefix = [
    `const SOURCES = ${JSON.stringify(publicSources())};`,
    `const DEFAULT_MODEL_URI = ${JSON.stringify(DEFAULT_MODEL_URI)};`,
    `const YANDEX_URL = ${JSON.stringify(YANDEX_URL)};`,
    "",
  ].join("\n");
  return prefix + WORKER_BODY;
}

async function main() {
  const target = resolve(process.argv[2] ?? "dist/_worker.js");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, await buildPreviewAssistantWorkerSource(), "utf8");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
