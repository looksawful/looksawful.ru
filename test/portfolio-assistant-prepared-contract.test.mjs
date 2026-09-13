import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const answersUrl = new URL("../src/features/portfolio-pet/prepared-answers.ts", import.meta.url);
const knowledgeUrl = new URL("../src/features/portfolio-pet/knowledge.ts", import.meta.url);

async function loadPreparedAnswers() {
  assert.equal(existsSync(answersUrl), true, "prepared-answer resolver must exist");
  return import(answersUrl.href);
}

const approvedFixtureIds = Object.freeze([
  "profile.role",
  "profile.work_scope",
  "profile.experience",
  "profile.cases_index",
  "project.jestei",
]);

test("approved common portfolio questions resolve as prepared answers", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({ approvedSourceIds: approvedFixtureIds });

  for (const message of ["Расскажи о себе", "Покажи резюме", "Какие у тебя кейсы?"]) {
    const result = routePortfolioAssistantRequest({ message, locale: "ru", context: { page: "home" } });
    assert.equal(result.kind, "prepared", `${message} should stay on the prepared path when its required sources are approved`);
    assert.equal(typeof result.answerId, "string");
    assert.ok(result.sourceIds.every((sourceId) => approvedFixtureIds.includes(sourceId)));
  }
});

test("prepared intent fails closed when required sources are not approved", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({ approvedSourceIds: [] });
  const result = routePortfolioAssistantRequest({ message: "Расскажи о себе", locale: "ru", context: { page: "home" } });
  assert.deepEqual(result, { kind: "no_data" });
});

test("natural-language variants map to prepared intent only when confidence is sufficient", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({ approvedSourceIds: ["profile.cases_index", "profile.role", "profile.about"] });

  const canonical = routePortfolioAssistantRequest({ message: "Кейсы", locale: "ru", context: { page: "home" } });
  const natural = routePortfolioAssistantRequest({ message: "Что из работ можно посмотреть?", locale: "ru", context: { page: "home" } });
  assert.equal(canonical.kind, "prepared");
  assert.equal(natural.kind, "prepared");
  assert.equal(natural.answerId, canonical.answerId);

  const ambiguous = routePortfolioAssistantRequest({ message: "Как ты вообще к этому относишься?", locale: "ru", context: { page: "home" } });
  assert.equal(ambiguous.kind, "generate", "ambiguous free-form input must not be forced into a prepared answer");
});

test("caller cannot self-approve generative evidence", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({ approvedSourceIds: ["profile.about", "project.jestei"] });

  const result = routePortfolioAssistantRequest({
    message: "Сравни мой запрос с твоим опытом нестандартно",
    locale: "ru",
    context: {
      page: "jestei",
      approvedSourceIds: ["attacker.injected", "profile.role"],
      email: "private@example.com",
      formMessage: "secret form draft",
    },
  });

  assert.equal(result.kind, "generate");
  assert.deepEqual(result.context.sourceIds, ["project.jestei"]);
  assert.equal(Object.hasOwn(result.context, "email"), false);
  assert.equal(Object.hasOwn(result.context, "formMessage"), false);
  assert.equal(Object.hasOwn(result.context, "fullKnowledgeBase"), false);
});

test("unknown ids in the trusted approval list fail closed instead of becoming evidence", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({ approvedSourceIds: ["does.not.exist", "project.jestei"] });
  const result = routePortfolioAssistantRequest({ message: "Как устроено это решение подробнее?", locale: "ru", context: { page: "jestei" } });
  assert.equal(result.kind, "generate");
  assert.deepEqual(result.context.sourceIds, ["project.jestei"]);
});

test("approved prepared answer content is usable without provider availability", async () => {
  const { createPortfolioAssistantRouter } = await loadPreparedAnswers();
  const routePortfolioAssistantRequest = createPortfolioAssistantRouter({
    approvedSourceIds: ["profile.role", "profile.work_scope", "profile.experience"],
  });
  const result = routePortfolioAssistantRequest({
    message: "Покажи резюме",
    locale: "ru",
    context: { page: "home", providerAvailable: false },
  });
  assert.equal(result.kind, "prepared");
  assert.ok(result.text.trim().length > 0);
});

test("preview assistant routes only relevant approved sources instead of dumping the whole knowledge base", async () => {
  const { createPreviewPortfolioAssistantRouter } = await loadPreparedAnswers();
  const router = createPreviewPortfolioAssistantRouter();
  const result = router({
    message: "Какими инструментами и технологиями я работаю?",
    locale: "ru",
    context: { page: "home" },
  });
  assert.equal(result.kind, "generate");
  assert.ok(result.context.sourceIds.includes("profile.skills"));
  assert.equal(result.context.sourceIds.includes("profile.contact"), false);
  assert.equal(result.context.sourceIds.includes("profile.education"), false);
  assert.equal(result.context.sourceIds.includes("project.jestei"), false);
  assert.ok(result.context.sourceIds.length <= 12);
});

test("preview assistant includes the current project before generic profile context", async () => {
  const { createPreviewPortfolioAssistantRouter } = await loadPreparedAnswers();
  const router = createPreviewPortfolioAssistantRouter();
  const result = router({ message: "Почему студия закрылась?", locale: "ru", context: { page: "/work/sensetique/" } });
  assert.equal(result.kind, "generate");
  assert.equal(result.context.sourceIds[0], "project.sensetique");
});

test("approved AI knowledge is first-person, human-readable and excludes rejected facts", async () => {
  assert.equal(existsSync(knowledgeUrl), true);
  const { buildPortfolioPetKnowledgeCandidates } = await import(knowledgeUrl.href);
  const candidates = buildPortfolioPetKnowledgeCandidates();
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const allText = candidates.map((candidate) => candidate.text).join("\n");

  assert.equal(byId.get("profile.role")?.text, "Я арт-директор цифровых продуктов и продуктовый дизайнер.");
  assert.equal(byId.get("profile.location")?.text, "Москва");
  assert.equal(byId.get("profile.contact")?.text, "i@lookawful.ru");
  assert.doesNotMatch(allText, /\+7\s*999|@looksawful|6\s*до\s*2|четыр[её]х\s+сегмент|рынок\s+США|GAC\s*Motors|Vanish|Дмитрия\s+Ульянова|\+15%|×2\.5/iu);

  const experience = byId.get("profile.experience")?.text ?? "";
  assert.match(experience, /клубн[^\n]*event|event[^\n]*клубн/iu);
  assert.match(experience, /повышени[^\n]*стоимост[^\n]*подписк/iu);
  assert.match(experience, /PUMA/);
  assert.match(experience, /H&M/);
  assert.match(byId.get("profile.education")?.text ?? "", /неоконченн[^\n]*высш/iu);

  const shootings = byId.get("project.shootings")?.text ?? "";
  assert.match(shootings, /фотограф/iu);
  assert.match(shootings, /продюсирован/iu);
  assert.match(shootings, /микс-медиа/iu);
});

test("production router uses the owner-approved knowledge allowlist", async () => {
  const { routePortfolioAssistantRequest } = await loadPreparedAnswers();
  const result = routePortfolioAssistantRequest({ message: "Какими технологиями я работаю?", locale: "ru", context: { page: "home" } });
  assert.equal(result.kind, "generate");
  assert.ok(result.context.sourceIds.includes("profile.skills"));
  assert.equal(result.context.sourceIds.includes("profile.contact"), false);
});
