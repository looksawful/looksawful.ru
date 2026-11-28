// Typography specimens from the production stylesheet.
// Do not redeclare font sizes, weights or line heights here.
const specimens = [
  {
    name: "Hero / H1",
    rule: ".hero h1 · --fs-900 / 700 / --lh-hero",
    html: '<section class="hero"><h1>работаю с формой</h1></section>',
  },
  {
    name: "Заголовок проекта",
    rule: ".project__title · --fs-800 / 700 / --lh-display",
    html: '<article class="project"><div class="project__intro"><h1 class="project__title project__title--text">jestei pool</h1></div></article>',
  },
  {
    name: "Заголовок раздела проекта",
    rule: ".project__section > h2 · clamp(1.4rem, 1.1rem + 1cqi, 2.15rem) / 600 / 1",
    html: '<article class="project"><section class="project__section"><h2>визуальная система</h2></section></article>',
  },
  {
    name: "Вводный текст проекта",
    rule: ".project__lead · --fs-600 / 500 / --lh-tight",
    html: '<article class="project"><div class="project__intro"><p class="project__lead">Дизайн объединяет идею, характер и визуальный язык.</p></div></article>',
  },
  {
    name: "Основной текст",
    rule: "body · --fs-400 / 400 / --lh-body",
    html: '<p>Каждый проект строится вокруг задачи, содержания и выразительной типографики.</p>',
  },
  {
    name: "Текст раздела проекта",
    rule: ".project__section > p · --fs-400 / 400 / --lh-copy",
    html: '<article class="project"><section class="project__section"><p>От исследования до готового интерфейса: структура, детали и работа с материалом.</p></section></article>',
  },
  {
    name: "Подпись медиа",
    rule: ".media__caption · container clamp / 400 / --lh-caption; mobile --fs-300",
    html: '<figure class="media" data-caption-view="full"><figcaption class="media__caption"><div class="media__caption-line"><span class="media__title">Фрагмент визуальной системы</span><span class="media__text">Описание изображения</span></div></figcaption></figure>',
  },
  {
    name: "Название Project Card",
    rule: ".project-card__name · размер от .project-card__caption / 600 / 1.36",
    html: '<article class="project-card"><div class="project-card__caption"><span class="project-card__name">sensetique</span><span class="project-card__focus">дизайн и разработка</span></div></article>',
  },
  {
    name: "Подпись Subproject Card",
    rule: ".subproject-card__caption · --fs-200 / наследуется / --lh-caption · пока вне index.css",
    html: '<div class="subproject-card"><div class="subproject-card__caption"><span class="subproject-card__title">съёмка для проекта</span><span class="subproject-card__description">серия визуальных материалов</span></div></div>',
  },
  {
    name: "Верхняя навигация",
    rule: ".site-nav · --fs-300 / наследуется / --lh-body",
    html: '<nav class="site-nav" aria-label="Пример навигации"><div class="site-nav__bar"><span>проекты</span><span>контакты</span></div></nav>',
  },
  {
    name: "Меню",
    rule: ".site-nav__menu-link · viewport clamp / 500 / .98",
    html: '<nav class="site-nav" aria-label="Пример меню"><div class="site-nav__menu"><div class="site-nav__menu-nav"><ul class="site-nav__menu-list"><li class="site-nav__menu-item"><span class="site-nav__menu-link">работы</span></li></ul></div></div></nav>',
  },
];

const catalogLayout = `
  .typography-catalog { inline-size:100%; min-block-size:100vh; padding:var(--page-padding-inline); color:var(--clr-text); background:var(--clr-bg); }
  .typography-catalog__intro { max-inline-size:65ch; margin-block-end:var(--size-500); }
  .typography-catalog__specimen { min-inline-size:0; padding-block:var(--size-400); border-block-start:1px solid var(--clr-border); }
  .typography-catalog__name { margin:0 0 .35rem; font-size:var(--fs-300); font-weight:var(--fw-600); line-height:var(--lh-ui); }
  .typography-catalog__rule { margin:0 0 var(--size-300); color:var(--clr-text-muted); font:400 .75rem/1.4 var(--ff-mono); overflow-wrap:anywhere; }
  .typography-catalog__sample { container:typography-sample/inline-size; inline-size:100%; min-inline-size:0; overflow:hidden; }
  .typography-catalog__sample :is(.hero,.project,.site-nav,.project-card) { position:static; min-block-size:0; block-size:auto; }
  .typography-catalog__sample .hero { display:block; padding:0; }
  .typography-catalog__sample .project__intro,
  .typography-catalog__sample .project__section { padding:0; }
  .typography-catalog__sample .site-nav__bar { min-block-size:0; padding:0; }
  .typography-catalog__sample .site-nav__menu { position:static; display:block; padding:0; overflow:visible; }
  .typography-catalog__sample .site-nav__menu-list { align-content:start; }
  .typography-catalog__sample .project-card__caption { min-block-size:0; padding:0; }
  .typography-catalog__sample .subproject-card__caption { min-block-size:0; padding:0; }
`;

export default {
  title: "00 Foundations",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "11 существующих CSS-ролей. Основной источник src/styles/index.css; subproject-cards.css подключён отдельно, поскольку пока отсутствует в импортах сайта.",
      },
    },
  },
};

export const Typography = {
  render: () => {
    const root = document.createElement("main");
    root.className = "typography-catalog";
    root.innerHTML = `<style>${catalogLayout}</style><div class="typography-catalog__intro"><p>11 текстовых ролей сайта. Изменяйте размер окна Storybook для проверки адаптивности.</p></div>`;

    for (const specimen of specimens) {
      const section = document.createElement("section");
      section.className = "typography-catalog__specimen";
      section.innerHTML = `
        <h2 class="typography-catalog__name">${specimen.name}</h2>
        <p class="typography-catalog__rule">${specimen.rule}</p>
        <div class="typography-catalog__sample">${specimen.html}</div>
      `;
      root.append(section);
    }

    return root;
  },
};
