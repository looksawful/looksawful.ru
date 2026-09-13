import { cvContent } from "../../data/cv.ts";
import { getVisibleProjectCardPresentations } from "../../data/projects.ts";

export type PortfolioPetKnowledgeApproval = "pending" | "approved";

export interface PortfolioPetKnowledgeCandidate {
  id: string;
  title?: string;
  text: string;
  source: string;
  approval: PortfolioPetKnowledgeApproval;
}

function pendingCandidate(
  candidate: Omit<PortfolioPetKnowledgeCandidate, "approval">,
): PortfolioPetKnowledgeCandidate {
  return Object.freeze({ ...candidate, approval: "pending" });
}

function compact(parts: readonly string[], maxLength = 3_900): string {
  const text = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");

  if (text.length <= maxLength) return text;
  const clipped = text.slice(0, maxLength);
  const boundary = Math.max(clipped.lastIndexOf("\n"), clipped.lastIndexOf(" "));
  return clipped.slice(0, boundary > 0 ? boundary : maxLength).trim();
}

function profileSkillText(): string {
  const sections = [cvContent.skills.hard, cvContent.skills.tech];
  return compact(sections.flatMap((section) =>
    section.visible
      ? section.rows.map((row) => `${row.label} ${row.text}`)
      : [],
  ));
}

function profileExperienceText(): string {
  return compact([
    [
      "JESTEI POOL — арт-директор, 2024–2026.",
      "Я отвечал за визуальный язык сервиса, UX/UI-стратегию основных продуктов, дизайн-систему и работу дизайн-команды.",
      "В продукте есть две основные аудитории: клубные диджеи и event-диджеи. Для них я работал над разными сценариями, навигацией, фильтрацией, лендингами и коммуникацией.",
      "Я занимался ребрендингом, Event-направлением, core-продуктами, коммуникационной платформой, рассылками, motion, исследованиями, CJM, тарифами и подписками, наймом, редполитикой и внедрением AI-пайплайнов.",
      "Изменения поддержали повышение стоимости подписки без снижения клиентской базы, а процессы и производство контента стали быстрее.",
    ].join(" "),
    [
      "STYX JEWEL — 2021–2025.",
      "Я несколько лет работал с брендом: занимался айдентикой и дизайном, разработал логотип и фирменный стиль, упаковку, печатные и рекламные материалы.",
      "Я также продюсировал и снимал кампейны, каталоги и лукбуки, обрабатывал фотографии и делал сканографические изображения и экспериментальную анимацию.",
    ].join(" "),
    [
      "SENSETIQUE — основатель и продюсер, 2016–2018.",
      "Я запустил фото- и видеопродакшен для моды и рекламы и коммерческую фотостудию с тремя съёмочными залами.",
      "Я отвечал за запуск площадки, команду и полный цикл производства: концепции, кастинги, локации, сметы, съёмку и постпродакшен.",
      "Sensetique уже закрыта. Если спрашивают почему, корректный ответ: со временем я переключился на другие направления работы и проекты.",
    ].join(" "),
    [
      "MAD COW FILMS — ассистент продюсера.",
      "Я работал в московском офисе международного рекламного продакшна, участвовал в подготовке проектов и тендеров, презентаций и документации, локейшн-скаутинге и кастинге.",
    ].join(" "),
    [
      "LI-NE AGENCY — junior-продюсер.",
      "Я организовывал фото- и видеосъёмки и мероприятия: препродакшн, кастинги, локации, логистику и координацию команды. Участвовал в проектах для «Детского мира», PUMA и H&M.",
    ].join(" "),
    [
      "ПРОГРЕСС-ТРАДИЦИЯ — книжный дизайнер, 2013–2015.",
      "Я разрабатывал и верстал научные и гуманитарные издания, в том числе книги Елены Ровенко и Бориса Ерёмина, а также руководил разработкой и администрированием сайта издательства.",
    ].join(" "),
    "РИА НОВОСТИ / «Московские новости» — в 2012–2013 годах я работал дизайнером-верстальщиком в городской газете о Москве.",
  ]);
}

function profileEducationText(): string {
  return compact([
    `${cvContent.education.higher.name}: ${cvContent.education.higher.lines.join("; ")}. Неоконченное высшее образование.`,
    ...cvContent.education.additional.map((item) =>
      `${item.name}: ${item.lines.join("; ")}`,
    ),
  ]);
}

function profileLanguageText(): string {
  return compact(cvContent.profile.languages.map((item) => `${item.name}: ${item.level}`));
}

function profilePrinciplesText(): string {
  return compact(cvContent.profile.principles.map((item) => `${item.title} ${item.text}`));
}

const APPROVED_PROJECT_TEXT: Readonly<Record<string, string>> = Object.freeze({
  jestei: [
    "Я работал арт-директором Jestei Pool в 2024–2026 годах.",
    "Это музыкальный сервис для диджеев с двумя основными аудиториями: клубными и event-диджеями.",
    "Я отвечал за визуальный язык, UX/UI-стратегию основных продуктов, дизайн-систему и дизайн-команду; работал над ребрендингом, Event-направлением, навигацией, фильтрацией, лендингами, коммуникацией, рассылками, motion, исследованиями, CJM, тарифами и AI-пайплайнами.",
    "Изменения поддержали повышение стоимости подписки без снижения клиентской базы, а процессы производства стали быстрее.",
  ].join(" "),
  styx: [
    "Я несколько лет работал со Styx Jewel в 2021–2025 годах.",
    "Занимался айдентикой и дизайном бренда, логотипом, фирменным стилем, упаковкой, печатными и рекламными материалами, соцсетями, каталогами и лукбуками.",
    "Также продюсировал и снимал кампейны, обрабатывал фотографии и делал сканографию и экспериментальную анимацию.",
  ].join(" "),
  sensetique: [
    "Я основал и продюсировал Sensetique в 2016–2018 годах: фото- и видеопродакшен для моды и рекламы и коммерческую фотостудию с тремя съёмочными залами.",
    "Студия уже закрыта. Со временем я переключился на другие направления работы и проекты.",
  ].join(" "),
  shootings: "Кроме продуктового и графического дизайна я занимаюсь фотографией, продюсированием съёмок и экспериментальным микс-медиа. В портфолио есть работы для музыкантов, брендов и выставочных проектов.",
});

export function buildPortfolioPetKnowledgeCandidates(): readonly PortfolioPetKnowledgeCandidate[] {
  const profileCandidates: PortfolioPetKnowledgeCandidate[] = [
    pendingCandidate({ id: "profile.name", text: "Меня зовут Иван Крушинский.", source: "owner-approved:cv.profile.name" }),
    pendingCandidate({ id: "profile.role", text: "Я арт-директор цифровых продуктов и продуктовый дизайнер.", source: "owner-approved:cv.profile.role" }),
    pendingCandidate({
      id: "profile.about",
      text: "Я проектирую цифровые продукты и визуальные системы, провожу ребрендинги, разрабатываю дизайн и руковожу креативными командами.",
      source: "owner-approved:cv.profile.aboutPrimary",
    }),
    pendingCandidate({ id: "profile.location", text: "Москва", source: "owner-approved:cv.profile.location" }),
    pendingCandidate({ id: "profile.contact", text: "i@lookawful.ru", source: "owner-approved:cv.profile.contacts.email" }),
    pendingCandidate({ id: "profile.skills", text: profileSkillText(), source: "owner-approved:cv.skills.hard+tech" }),
    pendingCandidate({ id: "profile.experience", text: profileExperienceText(), source: "owner-approved:cv.experience" }),
    pendingCandidate({ id: "profile.education", text: profileEducationText(), source: "owner-approved:cv.education" }),
    pendingCandidate({ id: "profile.languages", text: profileLanguageText(), source: "owner-approved:cv.profile.languages" }),
    pendingCandidate({ id: "profile.principles", text: profilePrinciplesText(), source: "owner-approved:cv.profile.principles" }),
  ];

  const projectCandidates = getVisibleProjectCardPresentations().map((project) =>
    pendingCandidate({
      id: `project.${project.id}`,
      title: project.title,
      text: APPROVED_PROJECT_TEXT[project.id] ?? "",
      source: `owner-approved:project-card.${project.id}`,
    }),
  );

  return Object.freeze([...profileCandidates, ...projectCandidates]);
}

export function selectApprovedKnowledge(
  candidates: readonly PortfolioPetKnowledgeCandidate[],
  approvedIds: readonly string[],
): readonly PortfolioPetKnowledgeCandidate[] {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  return Object.freeze(
    approvedIds.map((id) => {
      const candidate = byId.get(id);
      if (!candidate) throw new Error(`unknown knowledge candidate: ${id}`);
      return Object.freeze({ ...candidate, approval: "approved" as const });
    }),
  );
}
