type ExpertiseArea = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly actions: readonly string[];
};

const expertiseAreas = [
  {
    id: "art-direction",
    title: "Арт-дирекшн",
    description: "Определяю направление проекта, организую работу дизайнеров и отвечаю за результат.",
    actions: [
      "Определяю визуальное направление",
      "Разрабатываю визуальную концепцию",
      "Выбираю визуальные приёмы",
      "Формирую коммуникационную платформу",
      "Формулирую ключевые сообщения и ценностное предложение",
      "Определяю Tone of Voice и терминологию",
      "Задаю правила коммуникации",
      "Утверждаю ключевые визуальные и коммуникационные решения",
      "Задаю критерии качества",
      "Планирую работу команды",
      "Распределяю ответственность",
      "Ставлю задачи",
      "Утверждаю дизайн-решения",
      "Провожу дизайн-ревью",
      "Даю обратную связь",
      "Провожу онбординг",
      "Наставляю и развиваю дизайнеров",
      "Обучаю команду",
      "Контролирую качество и результат",
    ],
  },
  {
    id: "design",
    title: "Дизайн",
    description: "Создаю визуальные системы и дизайн для цифровых платформ и физических носителей.",
    actions: [
      "Создаю логотипы",
      "Работаю с типографикой и цветом",
      "Создаю графику и иллюстрации",
      "Создаю иконки и маскотов",
      "Создаю постеры, баннеры, обложки и презентации",
      "Проектирую упаковку, мерч и печатные материалы",
      "Работаю с композицией и сетками",
      "Формирую правила применения",
      "Собираю брендбук",
    ],
  },
  {
    id: "ux-ui",
    title: "UX/UI",
    description: "Исследую задачу, проектирую и развиваю интерфейс и продукт.",
    actions: [
      "Исследую пользователей и их задачи",
      "Изучаю пользовательский путь",
      "Исследую аудиторию и сегменты",
      "Исследую конкурентов и рынок",
      "Анализирую обратную связь",
      "Анализирую метрики",
      "Формирую и проверяю гипотезы",
      "Проектирую структуру, сценарии и навигацию",
      "Создаю вайрфреймы и прототипы",
      "Провожу юзабилити-тесты",
      "Проектирую функции",
      "Определяю приоритеты",
      "Анализирую ценность и монетизацию",
      "Проектирую UI, состояния и адаптивность",
      "Создаю токены, компоненты и паттерны",
      "Собираю и документирую дизайн-системы",
      "Запускаю новые функции",
      "Развиваю существующие функции",
      "Передаю дизайн в разработку",
      "Проверяю реализацию",
    ],
  },
  {
    id: "production",
    title: "Продюсирование и съемки.",
    description: "Организую съёмочный процесс и руковожу всем циклом производства контента .",
    actions: [
      "Разрабатываю концепцию съёмки",
      "Исследую визуальный контекст и собираю референсы",
      "Планирую бюджет",
      "Собираю команду",
      "Провожу кастинг",
      "Подбираю локации",
      "Определяю стилизацию, композицию и свет",
      "Координирую съёмку",
      "Отбираю материал",
      "Контролирую постпродакшн",
    ],
  },
  {
    id: "development-3d",
    title: "Разработка и 3D",
    description: "Проектируют и реализую интерактивные трёхмерные решения.",
    actions: [
      "Собираю интерфейсы",
      "Создаю интерактивные прототипы",
      "Разрабатываю веб-анимацию",
      "Создаю интерактивные механики",
      "Работаю с Canvas",
      "Работаю с WebGL",
      "Работаю с Three.js",
      "Определяю визуальный подход к 3D",
      "Моделирую low-poly, high-poly, hard-surface и органические объекты",
      "Создаю материалы и текстуры",
      "Создаю риги",
      "Анимирую",
      "Работаю со светом и камерами",
      "Рендерю",
    ],
  },
  {
    id: "ai",
    title: "Внедрение ИИ",
    description: "Встраиваю ИИ в рабочие процессы дизайнеров и использую его для производства контента, прототипирования макетов и автоматизации процессов",
    actions: [
      "Работаю с генеративными изображениями, видео и текстом",
      "Работаю с локальными и облачными моделями",
      "Подбираю ИИ-инструменты",
      "Встраиваю ИИ в рабочие процессы",
      "Собираю ИИ-пайплайны",
      "Создаю агентные сценарии",
      "Автоматизирую повторяемые задачи",
      "Обучаю команду ИИ-инструментам",
    ],
  },
] as const satisfies readonly ExpertiseArea[];

function renderActions(actions: readonly string[]): string {
  return actions
    .map((action) => `<span class="expertise__action">${action}</span>`)
    .join("\n");
}

function renderArea(area: ExpertiseArea, index: number): string {
  const panelId = `expertise-panel-${index + 1}`;

  return `
    <li class="expertise__item" data-expertise-item="${area.id}">
      <div class="expertise__head">
        <h3 class="expertise__title">${area.title}</h3>
        <p class="expertise__description">${area.description}</p>
      </div>
      <div class="expertise__panel" id="${panelId}" data-expertise-panel hidden inert>
        <div class="expertise__panel-inner">
          <div class="expertise__split split">
            <div class="expertise__media-slot" data-expertise-media="${area.id}"></div>
            <div class="expertise__actions">
              ${renderActions(area.actions)}
            </div>
          </div>
        </div>
      </div>
    </li>`;
}

function renderExpertise(): string {
  return `
    <h2 id="expertise-title">Экспертиза</h2>
    <ol class="expertise__list">
      ${expertiseAreas.map(renderArea).join("\n")}
    </ol>`;
}

export function mountExpertise(root: ParentNode = document): void {
  const section = root.querySelector<HTMLElement>(".expertise");

  if (!section) return;

  section.setAttribute("aria-labelledby", "expertise-title");
  section.dataset.expertiseMode = "static";
  section.innerHTML = renderExpertise();
  section.hidden = false;
}
