const JESTEI_COVER = `
  <div class="jestei-cover__screen" data-section-screen="">
    <section class="jestei-cover__head" data-cover-head="">
      <div class="jestei-cover__grid" data-cover-grid="">
        <figure class="jestei-cover__logo" aria-label="Jestei Pool 3D logo" data-cover-logo="">
          <canvas
            class="visual-canvas"
            data-three-poster="/assets/jestei/branding/jestei-logo.svg"
            data-three-scene="logo"
            data-visual-demo="three:logo"
            id="project-jestei-cover-logo-canvas"
          ></canvas>
        </figure>

        <div class="jestei-cover__meta">
          <div class="jestei-cover__dates" aria-label="период работы">
            <time datetime="2024">с 2024</time>
            <time datetime="2026">до 2026</time>
          </div>

          <h3 class="jestei-cover__wordmark">
            <img src="/assets/jestei/branding/jesteipool-wordmark-druk.svg" alt="Jestei Pool" decoding="async" loading="lazy" />
          </h3>

          <ul class="jestei-cover__roles" aria-label="моя позиция в Jestei Pool">
            <li>арт-директор</li>
            <li>ui/ux-лид</li>
            <li>дизайн-лид</li>
          </ul>
        </div>

        <p class="jestei-cover__summary">
          музыкальный сервис на next.js для диджеев, саунд-продюсеров и артистов. сервис помогает находить музыку и готовиться к выступлениям. я сформировал новый визуальный язык проекта, разработал ux/ui стратегию для core-продуктов и руководил всей командой дизайнеров проекта в течение двух с половиной лет.
        </p>
      </div>
    </section>
  </div>
`;

const JESTEI_BENTO = `
  <section class="section section-component jestei-bento" id="jestei-results" aria-label="результаты проекта Jestei Pool" data-section-component="" data-section-family="jestei" data-section-root="">
    <div class="jestei-masonry" data-animation="landing-masonry" aria-label="визуальная система Jestei Pool">
      <canvas class="visual-canvas jestei-masonry__canvas" id="jestei-masonry-canvas"></canvas>
    </div>

    <h2 class="jestei-bento__heading">чего мы добились</h2>
    <div class="jestei-bento__screen" data-section-screen="">
      <div class="jestei-bento__grid" data-jestei-bento="">
        <div class="jestei-bento__panel jestei-bento__panel--primary" data-bento-panel="primary">
          <article class="jestei-bento__card jestei-bento__card--steps" data-bento-card="steps">
            <div class="jestei-bento__content" data-bento-content="">
              <h3 class="jestei-bento__title jestei-bento__title--metric"><strong>2 шага</strong><span>вместо 6</span></h3>
              <p class="jestei-bento__side-copy">сократили пользовательский путь к трекам и плейлистам</p>
            </div>
          </article>

          <article class="jestei-bento__card jestei-bento__card--price" data-bento-card="price">
            <div class="jestei-bento__content" data-bento-content="">
              <h3 class="jestei-bento__title jestei-bento__title--price"><strong>+15%</strong><span>к цене продуктов</span></h3>
              <p>подняли цены без оттока клиентов и запустили сценарии возврата и апгрейда</p>
            </div>
          </article>

          <article class="jestei-bento__card jestei-bento__card--manual" data-bento-card="manual">
            <div class="jestei-bento__content" data-bento-content="">
              <h3 class="jestei-bento__title jestei-bento__title--mixed"><strong>в 2,5 раза</strong><span>сократили объем ручной работы</span></h3>
              <p>внедрили ai-пайплайны для генерации креативов, видео и прототипов в работу графических и ux/ui-дизайнеров, провели рефакторинг дизайн систему и внедрили современные подходы с переменными, дев-модом, цветовыми темами и плагинами</p>
            </div>
          </article>
        </div>

        <div class="jestei-bento__panel jestei-bento__panel--secondary" data-bento-panel="secondary">
          <article class="jestei-bento__card jestei-bento__card--rebrand" data-bento-card="rebrand">
            <div class="jestei-bento__content" data-bento-content="">
              <h3 class="jestei-bento__title">провели ребрендинг</h3>
              <p>сменили логотип, проработали типографику, сегментировали аудиторию при помощи 4 цветовых профилей и разработали tone of voice</p>
            </div>
            <div
              class="jestei-bento__logo-inspector"
              data-visual-demo="logo-inspector:compact"
              data-cv-poster="/assets/media/cases/jesteipool/01-logo/01/02.webp"
              data-logo-inspector-passive="true"
              aria-hidden="true"
            ></div>
          </article>

          <article class="jestei-bento__card jestei-bento__card--products" data-bento-card="products">
            <div class="jestei-bento__content" data-bento-content="">
              <h3 class="jestei-bento__title jestei-bento__title--regular">расширили продуктовую линейку 4 классам диджеев</h3>
              <p>ии-треки, видео-паки, алгоритмические плейлисты, прогрессивный фильтр треков для в двух аудиториях</p>
            </div>
          </article>

          <article class="jestei-bento__card jestei-bento__card--audience" data-bento-card="audience">
            <div class="jestei-bento__content" data-bento-content="">
              <h3 class="jestei-bento__title jestei-bento__title--regular">новая аудитория</h3>
              <p>освоили новую премиальную аудиторию ивент-диджеев, создали раздел и разработали собственную линейку инструментов для них</p>
            </div>
          </article>

          <article class="jestei-bento__card jestei-bento__card--usa" data-bento-card="usa">
            <div class="jestei-bento__content" data-bento-content="">
              <h3 class="jestei-bento__title">запуск в сша</h3>
              <p>адаптировали продукт и коммуникации к выходу на американский рынок</p>
            </div>
            <div class="jestei-bento__globe" aria-hidden="true">
              <svg id="jestei-usa-globe" role="img" aria-label="Америка на ортографической проекции глобуса"></svg>
            </div>
          </article>
        </div>

        <figure class="jestei-bento__audience-avatar" aria-hidden="true">
          <img src="/assets/jestei/branding/jestei-audience-star.png" alt="" decoding="async" loading="lazy" />
        </figure>
      </div>
    </div>
  </section>
`;

const JESTEI_COLOR = `
  <div class="jestei-color__screen" data-section-screen="">
    <div class="jestei-color-bento" data-color-bento="">
      <div class="jestei-color-bento__content">
        <header class="jestei-color-bento__head">
          <h2 class="jestei-color-bento__title"><span data-section-title-main="">добавили</span> <span class="jestei-color-bento__accent" data-section-title-accent="" aria-label="цвет"><span data-color-letter="orange">ц</span><span data-color-letter="blue">в</span><span data-color-letter="pear">е</span><span data-color-letter="biloba">т</span></span></h2>
          <p class="jestei-color-bento__lead">Сегментировали конфликтующие аудитории при помощи 4 цветовых профилей. Теперь цвет направляет пользователя к нужным продуктам.</p>
        </header>

        <article class="jestei-color-bento__card jestei-color-bento__palette-card" data-color-panel="palette">
          <section class="jestei-color-bento__palette-group jestei-color-bento__palette-group--feature">
            <h3>Feature</h3>
            <ul class="jestei-color-bento__swatch-list" aria-label="feature palette">
              <li><span>Biloba-50</span><b>#EDE5F9</b><i style="--swatch:#EDE5F9"></i></li>
              <li><span>Biloba-100</span><b>#D8C9F7</b><i style="--swatch:#D8C9F7"></i></li>
              <li><span>Biloba-400</span><b>#B2A1EA</b><i style="--swatch:#B2A1EA"></i></li>
              <li><span>Biloba-500</span><b>#8673B8</b><i style="--swatch:#8673B8"></i></li>
            </ul>
          </section>

          <section class="jestei-color-bento__palette-group jestei-color-bento__palette-group--basic">
            <h3>Basic</h3>
            <ul class="jestei-color-bento__swatch-list" aria-label="basic palette">
              <li><span>Gold-50</span><b>#FFCB99</b><i style="--swatch:#FFCB99"></i></li>
              <li><span>Gold-100</span><b>#FFB267</b><i style="--swatch:#FFB267"></i></li>
              <li><span>Gold-400</span><b>#F18200</b><i style="--swatch:#F18200"></i></li>
              <li><span>Gold-500</span><b>#B25017</b><i style="--swatch:#B25017"></i></li>
            </ul>
          </section>

          <section class="jestei-color-bento__palette-group jestei-color-bento__palette-group--event">
            <h3>Event</h3>
            <ul class="jestei-color-bento__swatch-list" aria-label="event palette">
              <li><span>Pear-50</span><b>#F5FACF</b><i style="--swatch:#F5FACF"></i></li>
              <li><span>Pear-100</span><b>#D7E737</b><i style="--swatch:#D7E737"></i></li>
              <li><span>Pear-400</span><b>#D1E231</b><i style="--swatch:#D1E231"></i></li>
              <li><span>Pear-500</span><b>#95AB34</b><i style="--swatch:#95AB34"></i></li>
            </ul>
          </section>

          <section class="jestei-color-bento__palette-group jestei-color-bento__palette-group--pro">
            <h3>PRO</h3>
            <ul class="jestei-color-bento__swatch-list" aria-label="pro palette">
              <li><span>Blue-50</span><b>#E6F3FF</b><i style="--swatch:#E6F3FF"></i></li>
              <li><span>Blue-100</span><b>#9CCCFF</b><i style="--swatch:#9CCCFF"></i></li>
              <li><span>Blue-400</span><b>#3D80D8</b><i style="--swatch:#3D80D8"></i></li>
              <li><span>Blue-500</span><b>#1751B7</b><i style="--swatch:#1751B7"></i></li>
            </ul>
          </section>
        </article>
      </div>

      <a class="jestei-color-bento__card jestei-color-bento__visual" data-lightbox-item="" href="/assets/media/cases/jesteipool/02-color/02/00.webp" rel="noopener noreferrer" target="_blank">
        <img alt="" decoding="async" loading="lazy" src="/assets/media/cases/jesteipool/02-color/02/00.webp" />
      </a>

      <div class="jestei-color-bento__brand-strip" aria-label="цветовые роли Jestei Pool">
        <span style="--strip-color:#F18200"><img src="/assets/jestei/branding/jestei-logo-mark.svg" alt="" decoding="async" loading="lazy" />Basic <b>#F18200</b></span>
        <span style="--strip-color:#D1E231"><img src="/assets/jestei/branding/jestei-logo-mark.svg" alt="" decoding="async" loading="lazy" />Event <b>#D1E231</b></span>
        <span style="--strip-color:#151718"><img src="/assets/jestei/branding/jestei-logo-mark.svg" alt="" decoding="async" loading="lazy" />Exclusive <b>#151718</b></span>
        <span style="--strip-color:#B2A1EA"><img src="/assets/jestei/branding/jestei-logo-mark.svg" alt="" decoding="async" loading="lazy" />Special <b>#B2A1EA</b></span>
        <span style="--strip-color:#FAFAFA"><img src="/assets/jestei/branding/jestei-logo-mark.svg" alt="" decoding="async" loading="lazy" />Dark <b>#FAFAFA</b></span>
      </div>
    </div>
  </div>
`;

const STYX_COVER = `
  <div class="styx-cover__screen" data-section-screen="">
    <section data-cover-head="">
      <div data-cover-grid="">
        <figure data-cover-logo="">
          <img alt="" decoding="async" loading="lazy" src="/assets/media/cases/styx/00/01.svg" />
        </figure>
        <div>
          <h3 class="title" data-cover-title="" data-section-title=""><span data-section-title-main="">styx</span><span data-section-title-accent="">jewels</span></h3>
          <ul class="chips">
            <li class="chip">дизайнер</li>
            <li class="chip">продюсер</li>
            <li class="chip">фотограф</li>
          </ul>
          <p>Нишевый московский бренд украшений, аксессуаров и одежды, вдохновленный готической романтикой и лавкрафтовским ужасом.</p>
        </div>
        <time class="meta">2021–2025</time>
      </div>
      <section aria-label="технологии в styx jewels" class="skill-cloud">
        <ul class="chips chips--skill skill-cloud__list">
          <li class="chip">art direction</li>
          <li class="chip">branding</li>
          <li class="chip">figma</li>
          <li class="chip">photo</li>
          <li class="chip">production</li>
          <li class="chip">photoshop</li>
        </ul>
      </section>
    </section>
  </div>
`;

const STYX_SLIDER_SECTION_IDS = [
  "styx-packaging",
  "styx-communications",
  "styx-print",
  "styx-photo-art",
  "styx-scanography",
];

const PET_PROJECTS = [
  {
    id: "berserk-timer",
    title: "berserk timer",
    description: "пет-проект с таймером и интерактивной визуальной оболочкой.",
    image: "/assets/media/pets/berserk-timer.png",
    modifier: "berserk",
  },
  {
    id: "awful-cases",
    title: "awful cases",
    description: "витрина кейсов с отдельным интерфейсом просмотра проектов.",
    image: "/assets/media/pets/awful-cases.png",
    modifier: "awful-cases",
  },
  {
    id: "awful-audit",
    title: "awful audit",
    description: "инструмент для разбора интерфейсов и фиксации аудиторских наблюдений.",
    image: "/assets/media/pets/awful-audit.png",
    modifier: "awful-audit",
  },
];

const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();

const scrollPolicyBookToRecordPool = (policySlot) => {
  const viewport = policySlot.querySelector(".policy-book__viewport");
  if (!(viewport instanceof HTMLElement)) return;

  const findTarget = () => {
    const candidates = [
      ...policySlot.querySelectorAll(".policy-page h1, .policy-page h2, .policy-page h3, .policy-page h4, .policy-page td, .policy-page p, .policy-page li"),
    ];

    return candidates.find((node) => {
      const text = normalizeText(node.textContent).toLowerCase();
      return text.includes("лента треков") && text.includes("record pool");
    });
  };

  const setScroll = () => {
    const target = findTarget();
    if (!(target instanceof HTMLElement)) return;

    const targetTop =
      target.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top +
      viewport.scrollTop;

    viewport.scrollTop = Math.max(0, targetTop - viewport.clientHeight * 0.18);
  };

  viewport.dataset.initialScrollTarget = "record-pool";
  requestAnimationFrame(() => {
    setScroll();
    requestAnimationFrame(setScroll);
  });
};

const placeJesteiWordsAfterResults = (root) => {
  const results = root.querySelector("#jestei-results");
  const words = root.querySelector("#jestei-words");
  if (!results || !words || results.nextElementSibling === words) return;

  results.insertAdjacentElement("afterend", words);
};

const clearPublicationVisibility = (element) => {
  element.hidden = false;
  element.style.removeProperty("display");
  element.style.removeProperty("visibility");
  element.style.removeProperty("opacity");
};

const getSectionTitle = (section) =>
  normalizeText(section?.querySelector("[data-section-title]")?.textContent || section?.getAttribute("aria-label"));

const setupHorizontalSlider = (slider) => {
  const track = slider.querySelector("[data-horizontal-slider-track]");
  const buttons = slider.querySelectorAll("[data-horizontal-slider-direction]");

  if (!track || slider.dataset.horizontalSliderReady === "true") {
    return;
  }

  slider.dataset.horizontalSliderReady = "true";

  const getStep = () => Math.max(track.clientWidth * 0.84, 1);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = Number(button.dataset.horizontalSliderDirection || 1);
      track.scrollBy({ left: direction * getStep(), behavior: "smooth" });
    });
  });

  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    track.scrollBy({
      left: (event.key === "ArrowRight" ? 1 : -1) * getStep(),
      behavior: "smooth",
    });
  });

  let startX = 0;
  let startScroll = 0;
  let isDragging = false;
  let didDrag = false;

  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    isDragging = true;
    didDrag = false;
    startX = event.clientX;
    startScroll = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }

    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) {
      didDrag = true;
    }
    track.scrollLeft = startScroll - delta;
  });

  const stopDrag = (event) => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    track.classList.remove("is-dragging");
    track.releasePointerCapture?.(event.pointerId);
  };

  track.addEventListener("pointerup", stopDrag);
  track.addEventListener("pointercancel", stopDrag);
  track.addEventListener(
    "click",
    (event) => {
      if (!didDrag) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      didDrag = false;
    },
    true,
  );
};

const buildStyxWorkSlider = (root) => {
  if (root.querySelector("#styx-work-slider")) {
    setupHorizontalSlider(root.querySelector("#styx-work-slider"));
    return;
  }

  const sections = STYX_SLIDER_SECTION_IDS.map((id) => root.querySelector(`#${id}`)).filter(Boolean);
  if (!sections.length) {
    return;
  }

  const slider = document.createElement("section");
  slider.className = "section section-component styx-work-slider";
  slider.id = "styx-work-slider";
  slider.setAttribute("aria-label", "работы Styx Jewels");
  slider.setAttribute("data-section-component", "");
  slider.setAttribute("data-section-family", "styx");

  slider.innerHTML = `
    <div class="styx-work-slider__screen" data-section-screen="">
      <header class="styx-work-slider__head">
        <h2 class="visually-hidden">работы Styx Jewels</h2>
        <div class="styx-work-slider__controls" aria-label="управление слайдером Styx Jewels">
          <button class="styx-work-slider__button" type="button" data-horizontal-slider-direction="-1" aria-label="показать предыдущую секцию"><span aria-hidden="true">←</span></button>
          <button class="styx-work-slider__button" type="button" data-horizontal-slider-direction="1" aria-label="показать следующую секцию"><span aria-hidden="true">→</span></button>
        </div>
      </header>
      <div class="styx-work-slider__track" data-horizontal-slider-track="" tabindex="0" aria-label="горизонтальный слайдер работ Styx Jewels"></div>
    </div>
  `;

  sections[0].insertAdjacentElement("beforebegin", slider);
  const track = slider.querySelector("[data-horizontal-slider-track]");

  sections.forEach((section, index) => {
    clearPublicationVisibility(section);
    section.setAttribute("data-styx-slider-source", "");

    const slide = document.createElement("article");
    slide.className = "styx-work-slider__slide";
    slide.setAttribute("aria-label", getSectionTitle(section) || `секция Styx ${index + 1}`);
    slide.append(section);
    track.append(slide);
  });

  setupHorizontalSlider(slider);
};

const buildPetProjectsBento = (root) => {
  if (root.querySelector("#pet-projects")) {
    return;
  }

  const entries = PET_PROJECTS.map((project) => {
    const section = root.querySelector(`#${project.id}`);
    const frame = section?.querySelector("[data-pet-project-frame]");
    return {
      ...project,
      section,
      href: frame?.getAttribute("src") || `/pets/${project.id}/`,
    };
  }).filter((project) => project.section);

  if (!entries.length) {
    return;
  }

  const section = document.createElement("section");
  section.className = "section section-component pet-projects-bento";
  section.id = "pet-projects";
  section.setAttribute("aria-label", "пет-проекты");
  section.setAttribute("data-section-component", "");
  section.setAttribute("data-section-family", "pets");

  section.innerHTML = `
    <div class="pet-projects-bento__screen" data-section-screen="">
      <header class="pet-projects-bento__head">
        <h2 class="pet-projects-bento__title">пет-проекты</h2>
      </header>
      <div class="pet-projects-bento__grid" data-pet-projects-bento=""></div>
    </div>
  `;

  const grid = section.querySelector("[data-pet-projects-bento]");
  entries.forEach((project) => {
    const card = document.createElement("article");
    card.className = `pet-projects-bento__card pet-projects-bento__card--${project.modifier}`;
    card.innerHTML = `
      <a class="pet-projects-bento__media" href="${project.href}" aria-label="открыть ${project.title}">
        <img alt="" decoding="async" loading="lazy" src="${project.image}" />
      </a>
      <div class="pet-projects-bento__body">
        <h3><a href="${project.href}">${project.title}</a></h3>
        <p>${project.description}</p>
      </div>
    `;
    grid.append(card);
  });

  entries[0].section.insertAdjacentElement("beforebegin", section);
  entries.forEach((project) => project.section.remove());
};

const buildJesteiWordsBento = (root) => {
  const section = root.querySelector("#jestei-words");
  if (!section || section.querySelector("[data-jestei-words-bento]")) {
    return;
  }

  const policyShell = section.querySelector(".policy-shell");

  const screen = document.createElement("div");
  screen.className = "jestei-words__screen";
  screen.setAttribute("data-section-screen", "");
  screen.innerHTML = `
    <div class="jestei-words-bento" data-jestei-words-bento="">
      <article class="jestei-words-bento__card jestei-words-bento__card--intro">
        <h2 class="jestei-words-bento__title" data-section-title="" data-content-title=""><span data-section-title-main="">нашли</span><span data-section-title-accent="">слова</span></h2>
        <p class="jestei-words-bento__lead" data-section-lead=""></p>
      </article>

      <article class="jestei-words-bento__card jestei-words-bento__card--fact" data-words-note-slot="">
        <div class="jestei-words-bento__metric"><strong>200+</strong> <span>плейлистов</span></div>
        <div class="jestei-words-bento__metric"><strong>50+</strong> <span>Жанров</span></div>
      </article>

      <article class="jestei-words-bento__card jestei-words-bento__card--scope">
        <h3>8 разделов</h3>
        <p>подсказки, описания, пояснительные тексты, FAQ и системные сообщения стали частью единой коммуникационной системы.</p>
      </article>

      <article class="jestei-words-bento__card jestei-words-bento__card--voice">
        <h3>tone of voice</h3>
        <p>редполитика, правила статей и постов, жанровые описания и продуктовые формулировки собраны в общий язык сервиса.</p>
      </article>

      <article class="jestei-words-bento__card jestei-words-bento__card--policy">
        <header>
          <h3>редполитика</h3>
          <p>интерактивная книга остается внутри секции, но теперь работает как главный media-элемент bento.</p>
        </header>
        <div class="jestei-words-bento__policy-slot" data-words-policy-slot=""></div>
      </article>
    </div>
  `;

  screen.querySelector(".jestei-words-bento__lead").textContent =
    "Сформировали твердую коммуникационную платформу сервиса: tone of voice, редакционную политику и правила написания статей и постов, оформили подсказки, описания и пояснительные тексты";

  const policySlot = screen.querySelector("[data-words-policy-slot]");
  if (policyShell) {
    policySlot.append(policyShell);
    scrollPolicyBookToRecordPool(policySlot);
  }

  section.innerHTML = "";
  section.append(screen);
};

const retargetPetLinks = (root) => {
  root.querySelectorAll('a[href="#berserk-timer"]').forEach((link) => {
    link.setAttribute("href", "#pet-projects");
  });
};

export function prepareHomepagePublication(root = document) {
  retargetPetLinks(root);

  const jesteiCover = root.querySelector("#jestei-cover");
  if (jesteiCover) {
    jesteiCover.setAttribute("aria-label", "шапка проекта jestei pool");
    jesteiCover.innerHTML = JESTEI_COVER;
  }

  if (!root.querySelector("#jestei-results") && jesteiCover) {
    jesteiCover.insertAdjacentHTML("afterend", JESTEI_BENTO);
  }

  const jesteiColor = root.querySelector("#jestei-color");
  if (jesteiColor) {
    jesteiColor.innerHTML = JESTEI_COLOR;
  }

  buildJesteiWordsBento(root);
  placeJesteiWordsAfterResults(root);

  const styxCover = root.querySelector("#styx-cover");
  if (styxCover) {
    styxCover.innerHTML = STYX_COVER;
  }

  buildStyxWorkSlider(root);
  buildPetProjectsBento(root);
}
