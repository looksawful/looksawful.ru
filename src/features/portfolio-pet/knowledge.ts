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

const ABOUT_PLAIN_TEXT = "Если проще: я помогаю цифровому продукту стать понятнее, удобнее и визуально цельнее. Разбираюсь в задаче и аудитории, проектирую сценарии и интерфейсы, формирую визуальную систему и организую работу дизайна вместе с разработкой.";

const WORK_SCOPE_TEXT = [
  "Моя работа обычно идёт сразу на нескольких уровнях: продукт, интерфейс, визуальный язык и дизайн-процесс.",
  "Я исследую аудиторию и конкурентов, формирую UX/UI-стратегию, проектирую пользовательские сценарии и интерфейсы, развиваю визуальные системы и брендинг, провожу дизайн-ревью и координирую работу дизайна и разработки от идеи до релиза.",
].join(" ");

const PRODUCT_UI_TEXT = [
  "В интерфейсах я исследую аудиторию и конкурентов, провожу глубинные интервью, коридорные и usability-тесты и формулирую гипотезы.",
  "Я проектирую функции и пользовательские сценарии, информационную архитектуру, CJM и user flow, делаю прототипы и адаптивные интерфейсы, развиваю дизайн-системы и анализирую продуктовые метрики.",
].join(" ");

const BRANDING_TEXT = [
  "В брендинге я разрабатываю визуальные концепции и системы, провожу ребрендинги и веду арт- и дизайн-направление.",
  "В практической работе это может включать логотип, типографику, цветовую палитру, печатные материалы, упаковку, мерч, маскота, иконки и графику, а также брендбук.",
].join(" ");

const TEAM_LEADERSHIP_TEXT = [
  "Под руководством дизайн- и креативной командой в моей работе я имею в виду конкретный процесс: ставлю задачи, обучаю дизайнеров, выстраиваю продакшн, провожу дизайн-ревью и контролирую реализацию.",
  "Я координирую работу дизайнеров и разработчиков от идеи до релиза.",
].join(" ");

const SHOOT_PRODUCTION_TEXT = [
  "В съёмочном продакшне я умею формировать команду и координировать подрядчиков, работать с бюджетом, кастингом, локациями, стилизацией, арендой оборудования и организацией съёмочного процесса.",
  "Также занимаюсь постановкой света, постпродакшеном, ретушью и цветокоррекцией.",
].join(" ");

const CASE_INDEX_TEXT = [
  "Основные кейсы в портфолио:",
  "Jestei Pool — музыкальный сервис для диджеев, где я работал арт-директором.",
  "Styx Jewel — нишевый бренд украшений: айдентика, дизайн, упаковка, каталоги и съёмки.",
  "Sensetique — основанные мной фото-/видеопродакшен и коммерческая фотостудия.",
  "Shootings — фотография, съёмочный продакшн и экспериментальный микс-медиа.",
].join("\n");

const COMMERCIAL_TEXT = [
  "Для первичного обсуждения нового дизайн-проекта нужно понять, что это за проект, какая задача, на каком он этапе, что уже есть из материалов, макетов или референсов и какой результат нужен.",
  "Это нужно, чтобы понять задачу и предметно обсудить проект. Нельзя обещать, что проект уже принят в работу, и нельзя называть цену или сроки без обсуждения задачи.",
  "Для продолжения разговора доступен email i@lookawful.ru.",
].join(" ");

const JESTEI_INTERFACE_TEXT = [
  "В Jestei я работал над навигацией и поиском музыки, прогрессивной фильтрацией треков и ключевыми пользовательскими сценариями.",
  "Фильтрация сочетает быстрый и расширенный режимы; среди параметров есть жанры, BPM и тональность в Classic/Camelot.",
  "Также я проектировал сценарии Event-направления, тарифов и подписок, лендинги и другие части core-продукта.",
].join(" ");

const JESTEI_DESIGN_SYSTEM_TEXT = [
  "В Jestei я реорганизовал дизайн-систему, создавал документацию и использовал её как основу для работы над продуктом.",
  "Я также проводил дизайн-ревью, координировал дизайн и разработку и работал над тем, чтобы подготовка макетов и прототипов происходила быстрее и последовательнее.",
].join(" ");

const JESTEI_COMMUNICATION_TEXT = [
  "В Jestei я работал не только с интерфейсом, но и с коммуникацией продукта: коммуникационной платформой, ключевыми сообщениями, tone of voice, редакционной политикой, лендингами и рассылками.",
  "Я также делал материалы для рекламы и работал над разной подачей продукта для клубных и event-диджеев.",
].join(" ");

const STYX_IDENTITY_TEXT = [
  "Для Styx Jewel я разработал логотип и фирменный стиль и поддерживал единую визуальную систему бренда.",
  "Она охватывала упаковку, печатные материалы, соцсети, рекламные публикации и баннеры, каталоги и лукбуки.",
].join(" ");

const STYX_PRODUCTION_TEXT = [
  "Для Styx Jewel я продюсировал и снимал кампейны, лукбуки и каталоги.",
  "После съёмки занимался обработкой фотографий, а также создавал сканографические изображения и экспериментальную анимацию.",
].join(" ");

const SENSETIQUE_PRODUCTION_TEXT = [
  "В Sensetique я отвечал за производство от организации команды до готового материала: препродакшн, кастинги, локации, сметы и логистику, съёмку и постпродакшен.",
  "Параллельно я запустил коммерческую фотостудию с тремя съёмочными залами.",
].join(" ");

const SHOOTINGS_DETAIL_TEXT = [
  "В направлении Shootings я совмещаю фотографию, продюсирование съёмок и экспериментальный микс-медиа.",
  "Работа включает как саму съёмку, так и подготовку производства и постпродакшен; в портфолио есть проекты для музыкантов, брендов и выставок.",
].join(" ");

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
    pendingCandidate({ id: "profile.about_plain", text: ABOUT_PLAIN_TEXT, source: "owner-approved:derived.cv.profile.plain-language" }),
    pendingCandidate({ id: "profile.work_scope", text: WORK_SCOPE_TEXT, source: "owner-approved:derived.cv.profile.work-scope" }),
    pendingCandidate({ id: "profile.cases_index", text: CASE_INDEX_TEXT, source: "owner-approved:derived.project-index" }),
    pendingCandidate({ id: "profile.location", text: "Москва", source: "owner-approved:cv.profile.location" }),
    pendingCandidate({ id: "profile.contact", text: "i@lookawful.ru", source: "owner-approved:cv.profile.contacts.email" }),
    pendingCandidate({ id: "profile.skills", text: profileSkillText(), source: "owner-approved:cv.skills.hard+tech" }),
    pendingCandidate({ id: "profile.product_ui", text: PRODUCT_UI_TEXT, source: "owner-approved:derived.cv.skills.product-ux-ui" }),
    pendingCandidate({ id: "profile.branding", text: BRANDING_TEXT, source: "owner-approved:derived.cv.skills.identity-art-direction" }),
    pendingCandidate({ id: "profile.team_leadership", text: TEAM_LEADERSHIP_TEXT, source: "owner-approved:derived.cv.principles.team-process" }),
    pendingCandidate({ id: "profile.shoot_production", text: SHOOT_PRODUCTION_TEXT, source: "owner-approved:derived.cv.skills.shoot-production" }),
    pendingCandidate({ id: "profile.commercial", text: COMMERCIAL_TEXT, source: "owner-approved:assistant.commercial-intake-policy" }),
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

  const detailCandidates: PortfolioPetKnowledgeCandidate[] = [
    pendingCandidate({ id: "project.jestei.interfaces", title: "Jestei Pool — интерфейсы", text: JESTEI_INTERFACE_TEXT, source: "owner-approved:jestei.interface-details" }),
    pendingCandidate({ id: "project.jestei.design_system", title: "Jestei Pool — дизайн-система и процесс", text: JESTEI_DESIGN_SYSTEM_TEXT, source: "owner-approved:jestei.design-system-process" }),
    pendingCandidate({ id: "project.jestei.communication", title: "Jestei Pool — коммуникация", text: JESTEI_COMMUNICATION_TEXT, source: "owner-approved:jestei.communication" }),
    pendingCandidate({ id: "project.styx.identity", title: "Styx Jewel — айдентика", text: STYX_IDENTITY_TEXT, source: "owner-approved:styx.identity" }),
    pendingCandidate({ id: "project.styx.production", title: "Styx Jewel — съёмки и медиа", text: STYX_PRODUCTION_TEXT, source: "owner-approved:styx.production" }),
    pendingCandidate({ id: "project.sensetique.production", title: "Sensetique — продакшн", text: SENSETIQUE_PRODUCTION_TEXT, source: "owner-approved:sensetique.production" }),
    pendingCandidate({ id: "project.shootings.details", title: "Shootings — процесс", text: SHOOTINGS_DETAIL_TEXT, source: "owner-approved:shootings.details" }),
  ];

  return Object.freeze([...profileCandidates, ...projectCandidates, ...detailCandidates]);
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
