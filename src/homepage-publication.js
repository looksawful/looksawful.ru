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
              <p class="jestei-bento__side-copy">сократили пользовательский путь к трекам</p>
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
          </article>
        </div>
      </div>
    </div>
  </section>
`;

const JESTEI_COLOR = `
  <div class="jestei-color__screen" data-section-screen="">
    <div class="jestei-color-bento" data-color-bento="">
      <div class="jestei-color-bento__panel jestei-color-bento__panel--intro" data-color-panel="intro">
        <header class="jestei-color-bento__card jestei-color-bento__card--head">
          <h2 class="jestei-color-bento__title" data-color-headline="jestei">
            <span data-section-title-main="">добавили</span>
            <span data-section-title-accent="">ц в е т</span>
          </h2>
          <p class="jestei-color-bento__lead">Сегментировали конфликтующие аудитории при помощи 4 цветовых профилей. Теперь цвет направляет пользователя к нужным продуктам.</p>
        </header>

        <a class="jestei-color-bento__card jestei-color-bento__visual jestei-color-bento__visual--main" data-lightbox-item="" href="/assets/media/cases/jesteipool/02-color/04/00.webp" rel="noopener noreferrer" target="_blank">
          <img alt="" decoding="async" loading="lazy" src="/assets/media/cases/jesteipool/02-color/04/00.webp" />
        </a>
      </div>

      <div class="jestei-color-bento__panel jestei-color-bento__panel--system" data-color-panel="system">
        <article class="jestei-color-bento__card jestei-color-bento__card--zones">
          <h3>визуальные зоны</h3>
          <p>Создали отдельные визуальные зоны для ивент диджеев, клубных диджеев и саунд-продюсеров. Цветовые профили связали продукты и подписки, разделили конфликтующие аудитории и снизили количество конфликтов между ними.</p>
        </article>

        <article class="jestei-color-bento__card jestei-color-bento__card--system">
          <h3>4 продуктовые темы</h3>
          <p>Раньше сервис держался на серо-оранжевой палитре. Тепреь в системе 4 продуктовые темы: оранжевая для клуба, грушевая для ивента, синяя для эксклюзивов и лавандовая для экспериментальных инструментов.</p>
        </article>

        <a class="jestei-color-bento__card jestei-color-bento__visual jestei-color-bento__visual--secondary" data-lightbox-item="" href="/assets/media/cases/jesteipool/02-color/02/00.webp" rel="noopener noreferrer" target="_blank">
          <img alt="" decoding="async" loading="lazy" src="/assets/media/cases/jesteipool/02-color/02/00.webp" />
        </a>
      </div>

      <div class="jestei-color-bento__panel jestei-color-bento__panel--palette" data-color-panel="palette">
        <article class="jestei-color-bento__card jestei-color-bento__theme jestei-color-bento__theme--orange">
          <div class="jestei-color-bento__theme-head"><span>клуб</span><h3>gold-drop</h3></div>
          <ul class="jestei-color-bento__tokens" aria-label="gold drop">
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--500"></span><span>500</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--100"></span><span>100</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--300"></span><span>300</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--700"></span><span>700</span></li>
          </ul>
        </article>

        <article class="jestei-color-bento__card jestei-color-bento__theme jestei-color-bento__theme--blue">
          <div class="jestei-color-bento__theme-head"><span>эксклюзивы</span><h3>dodger-blue</h3></div>
          <ul class="jestei-color-bento__tokens" aria-label="dodger blue">
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--500"></span><span>500</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--100"></span><span>100</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--300"></span><span>300</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--700"></span><span>700</span></li>
          </ul>
        </article>

        <article class="jestei-color-bento__card jestei-color-bento__theme jestei-color-bento__theme--pear">
          <div class="jestei-color-bento__theme-head"><span>ивент</span><h3>pear</h3></div>
          <ul class="jestei-color-bento__tokens" aria-label="pear">
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--500"></span><span>500</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--100"></span><span>100</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--300"></span><span>300</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--700"></span><span>700</span></li>
          </ul>
        </article>

        <article class="jestei-color-bento__card jestei-color-bento__theme jestei-color-bento__theme--biloba">
          <div class="jestei-color-bento__theme-head"><span>эксперименты</span><h3>biloba-flower</h3></div>
          <ul class="jestei-color-bento__tokens" aria-label="biloba flower">
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--500"></span><span>500</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--100"></span><span>100</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--300"></span><span>300</span></li>
            <li><span class="jestei-color-bento__swatch jestei-color-bento__swatch--700"></span><span>700</span></li>
          </ul>
        </article>
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

export function prepareHomepagePublication(root = document) {
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

  const styxCover = root.querySelector("#styx-cover");
  if (styxCover) {
    styxCover.innerHTML = STYX_COVER;
  }
}
