import "../storybook/color-architecture.css";

function page(content) {
  const root = document.createElement("main");
  root.className = "color-map";
  root.innerHTML = content;
  return root;
}

export default {
  title: "00 Foundations/Color Architecture",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "A map of the existing color hierarchy. Informational only: no new themes, tokens, or website behavior.",
      },
    },
  },
};

export const Overview = {
  render: () => page(`
    <h1>Цветовая архитектура</h1>
    <p class="color-map__lead">Два исходных цвета задают интерфейс. Темы проектов могут переопределить основу. Собственные палитры компонентов стоят отдельно.</p>

    <div class="color-map__sources" aria-label="Два уровня цветовой системы">
      <section class="color-map__source" data-color-level="site" data-color-source="site">
        <div class="color-map__heading"><h2>Уровень 1. Сайт</h2><span class="color-map__status">Используется</span></div>
        <p>Глобальные переменные <code>:root</code>. Ровно два исходных цвета.</p>
        <div class="color-map__primary">
          <div><span class="color-map__large-swatch" style="background:var(--clr-surface)"></span><code>--clr-surface</code><small>#FFFFFF</small></div>
          <div><span class="color-map__large-swatch" data-color-role="foreground" style="background:var(--clr-foreground)"></span><code>--clr-foreground</code><small>#111111</small></div>
        </div>
        <p class="color-map__file">src/styles/colors.css</p>
      </section>
      <section class="color-map__source" data-color-level="projects" data-color-source="project">
        <div class="color-map__heading"><h2>Уровень 2. Проекты</h2><span class="color-map__status">Подготовлен</span></div>
        <p>24 набора <code>data-theme</code> могут заменять <code>surface</code> и <code>foreground</code> внутри проекта.</p>
        <p>В исходниках также остались <code>accent</code> и <code>on-accent</code>. Они не являются глобальными цветами сайта; пока демонстрируются только в Storybook.</p>
        <a class="color-map__link" href="/?path=/story/00-foundations-design-tokens-project-themes--all-presets" target="_top">Открыть все 24 темы</a>
        <p class="color-map__file">src/lab/storybook/project-theme-presets.css</p>
      </section>
    </div>

    <div class="color-map__connections" aria-hidden="true"><span>↓ по умолчанию</span><span>↓ при включении темы проекта</span></div>

    <section class="color-map__semantic" aria-label="Общий слой производных цветовых ролей">
      <h2>Семантические роли</h2>
      <p>Одни формулы работают с текущими <code>surface</code> и <code>foreground</code>. Не нужно вручную подбирать цвет для каждого элемента.</p>
      <div class="color-map__derivatives">
        <div>
          <h3>От surface</h3>
          <ul>
            <li><code>--clr-surface-page</code> · 2,5% чёрного в цвете поверхности</li>
            <li><code>--clr-bg</code> · фон страницы</li>
            <li><code>--clr-surface-raised</code> · светлая поверхность</li>
            <li><code>--clr-surface-elevated</code> · светлая поверхность</li>
            <li><code>--clr-selection-text</code> · текст выделения</li>
          </ul>
        </div>
        <div>
          <h3>От foreground</h3>
          <ul>
            <li><code>--clr-text</code> · основной текст</li>
            <li><code>--clr-text-muted</code> · непрозрачность 62%</li>
            <li><code>--clr-border</code> · непрозрачность 20%</li>
            <li><code>--clr-border-strong</code> · непрозрачность 45%</li>
            <li><code>--clr-hover-tint</code> · непрозрачность 6%</li>
            <li><code>--clr-selection-bg</code> · фон выделения</li>
          </ul>
        </div>
      </div>
      <div class="color-map__samples" aria-label="Реальные образцы производных цветов">
        <div><span class="color-map__sample"><span style="background:var(--clr-bg)"></span></span><code>bg</code></div>
        <div><span class="color-map__sample"><span style="background:var(--clr-text-muted)"></span></span><code>muted · 62%</code></div>
        <div><span class="color-map__sample"><span style="background:var(--clr-border)"></span></span><code>border · 20%</code></div>
        <div><span class="color-map__sample"><span style="background:var(--clr-hover-tint)"></span></span><code>hover · 6%</code></div>
      </div>
    </section>

    <section class="color-map__outcome">
      <div><h2>Результат</h2><p>Фон, текст, разделители, hover и выделение. Ссылки наследуют цвет текста; отдельного глобального акцента нет.</p></div>
      <p class="color-map__file">src/styles/base.css · src/styles/index.css</p>
    </section>

    <section class="color-map__outside">
      <div><h2>Вне иерархии: цвета компонентов</h2><p>Jestei, мокапы, фильтр плейлистов, подписи и лайтбокс имеют собственные палитры. Не смешиваем их с глобальными токенами до отдельного разбора.</p></div>
      <a class="color-map__link" href="/?path=/story/00-foundations-color-architecture--component-exceptions" target="_top">Посмотреть исключения</a>
    </section>
  `),
};

export const ComponentExceptions = {
  render: () => page(`
    <h1>Исключения компонентов</h1>
    <p class="color-map__lead">Отдельная область для локальных цветов. Это инвентаризация для будущего решения, не предложение объединить всё в одну палитру.</p>

    <section class="color-map__exception" data-component-palette="jestei">
      <div class="color-map__heading"><h2>Jestei · пять режимов</h2><span class="color-map__status">Своя система</span></div>
      <p>У каждого режима свой основной цвет, градиент фона, текст, свечение и четыре образца. Переходы между режимами смешиваются через <code>color-mix()</code>.</p>
      <div class="jestei-theme-organism color-map__jestei-root">
        <div class="color-map__jestei-colors" role="list" aria-label="Основные цвета пяти режимов Jestei">
          <div role="listitem"><span style="background:rgb(var(--jestei-neutral-rgb))"></span><small>neutral</small></div>
          <div role="listitem"><span style="background:rgb(var(--jestei-basic-rgb))"></span><small>basic</small></div>
          <div role="listitem"><span style="background:rgb(var(--jestei-event-rgb))"></span><small>event</small></div>
          <div role="listitem"><span data-jestei-pro-color style="background:rgb(var(--jestei-pro-rgb))"></span><small>pro</small></div>
          <div role="listitem"><span style="background:rgb(var(--jestei-feature-rgb))"></span><small>feature</small></div>
        </div>
      </div>
      <p class="color-map__file">src/components/jestei-theme-organism/jestei-theme-organism.css</p>
    </section>

    <section class="color-map__exception" data-component-palette="mockups">
      <div class="color-map__heading"><h2>Мокапы и терминалы</h2><span class="color-map__status">Локальные значения</span></div>
      <p>Тёмные поверхности браузеров и терминалов, серые панели и цветные индикаторы окон. Их палитра имитирует предметный интерфейс, а не оформление сайта.</p>
      <div class="color-map__dots" role="group" aria-label="Примеры цветов окон"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span></div>
      <p class="color-map__file">src/styles/components.css · src/styles/code-block.css</p>
    </section>

    <section class="color-map__exception" data-component-palette="playlist">
      <div class="color-map__heading"><h2>Фильтр плейлистов</h2><span class="color-map__status">Автономный интерфейс</span></div>
      <p>Собственные тёмные поверхности и цветные состояния. Например, <code>--accent-biloba</code> и <code>--accent-blue-hover</code>: это локальные имена, не глобальный <code>--clr-accent</code>.</p>
      <div class="color-map__dots" role="group" aria-label="Примеры локальной палитры фильтра"><span style="background:#151718"></span><span style="background:#B2A1EA"></span><span style="background:#1760C1"></span></div>
      <p class="color-map__file">public/components/playlist-filter-workflow.css</p>
    </section>

    <section class="color-map__exception" data-component-palette="overlays">
      <div class="color-map__heading"><h2>Медиа, подписи и состояния</h2><span class="color-map__status">Контекстные цвета</span></div>
      <p>Белые и чёрные полупрозрачные подписи, затемнение лайтбокса, локальные ошибки формы. Эти значения привязаны к конкретным функциям.</p>
      <p class="color-map__file">src/styles/captions.css · media-lightbox.css · contact-form-hub.css · before-after.css</p>
    </section>

    <section class="color-map__outside">
      <div><h2>Что разбирать позже</h2><p>Проверять повторяющиеся назначения, реальные состояния и прозрачность. Переносить в общие токены только цвета с одинаковой ролью. Пока все локальные системы остаются без изменений.</p></div>
    </section>
  `),
};
