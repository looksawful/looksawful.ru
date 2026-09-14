import "../../styles/subproject-cards.css";
import "./pet-projects.stories.css";

const AWFUL_STUDIO_UI_COVER =
  "https://raw.githubusercontent.com/looksawful/awful-studio/22d0598c34fa500bf2c7aca2b7004f22a9a66751/scene_lab/ui_screens_v2/white_studio_v2_rendered_ui.png";

const cards = [
  {
    id: "awful-cases",
    title: "Awful Cases",
    description: "Утилита для Windows: регистр и типографика выделенного текста.",
    cover: "awful-cases",
  },
  {
    id: "moves-awful",
    title: "Moves Awful",
    description: "Библиотека с шаблонами анимированных canvas галерей для лендингов.",
    cover: "moves-awful",
  },
  {
    id: "berserk-timer",
    title: "Berserk Timer",
    description: "Консольный помодоро-таймер для Windows.",
    cover: "berserk-timer",
  },
  {
    id: "awful-studio",
    title: "AWFUL STUDIO",
    description: "Расширение Blender для сборки виртуальной предметной студии.",
    cover: "awful-studio",
  },
];

function coverMarkup(card) {
  switch (card.cover) {
    case "awful-cases":
      return `
        <div class="lab-pet-cover lab-pet-cover--awful-cases" aria-hidden="true">
          <div class="lab-awful-wordmark"><span>AWFUL</span><small>cases</small></div>
          <div class="lab-awful-keys"><span>AA</span><span>aa</span><span>Aa</span></div>
          <img src="/pets/awful-cases/assets/victory.png" alt="" loading="eager">
        </div>
      `;
    case "moves-awful":
      return `
        <img
          src="/media/projects/jestei/landings/moves-awful/poster/01-2044x1112.webp"
          alt=""
          loading="eager"
        >
      `;
    case "berserk-timer":
      return `
        <div class="lab-pet-cover lab-pet-cover--berserk" aria-hidden="true">
          <div class="lab-berserk-bar"><span>BERSERK TIMER</span><span>startup</span></div>
          <pre><span class="lab-berserk-accent">███   ▄███▄   █▄▄▄▄   ▄▄▄▄▄
█  █  █▀   ▀  █  ▄▀  █     ▀▄
█ ▀ ▄ ██▄▄    █▀▀▌ ▄  ▀▀▀▀▄
█  ▄▀ █▄   ▄▀ █  █  ▀▄▄▄▄▀
███   ▀███▀      █</span>

<span class="lab-berserk-muted">version: 0.2.1-beta</span>

<span class="lab-berserk-head">INSTRUCTIONS:</span>
  Set timer duration in minutes
  Presets: -x -s -m -l -X
  Press 'p' to pause/resume
  Press 'v' to view today's log

<span class="lab-berserk-accent">&gt; 25 min / focus</span></pre>
        </div>
      `;
    case "awful-studio":
      return `
        <div class="lab-pet-cover lab-pet-cover--awful-studio">
          <img
            src="${AWFUL_STUDIO_UI_COVER}"
            alt=""
            loading="eager"
          >
        </div>
      `;
    default:
      return "";
  }
}

function cardMarkup(card) {
  return `
    <article class="subproject-card" data-shape="landscape" data-subproject-id="${card.id}">
      <figure class="subproject-card__figure">
        <div class="subproject-card__media">
          ${coverMarkup(card)}
        </div>
        <figcaption class="subproject-card__caption">
          <h3 class="subproject-card__title">${card.title}</h3>
          <p class="subproject-card__description">${card.description}</p>
        </figcaption>
      </figure>
    </article>
  `;
}

function renderCandidate() {
  const root = document.createElement("div");
  root.className = "lab-pet-projects-story";
  root.innerHTML = `
    <section class="pet-projects lab-pet-projects-candidate" aria-labelledby="lab-pet-projects-title">
      <h2 id="lab-pet-projects-title">Полезное</h2>
      <div class="pet-projects__grid" aria-label="Полезные проекты">
        ${cards.map(cardMarkup).join("\n")}
      </div>
    </section>
  `;
  return root;
}

const meta = {
  title: "03 Organisms/Pet Projects Reel",
  tags: ["autodocs", "experimental"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Production-like approval candidate for the homepage Pet Projects organism. Mobile uses a centered horizontal snap reel with a larger active card; medium containers resolve to a 2×2 grid; wide containers show four balanced cards in one row.",
      },
    },
  },
};

export default meta;

export const ResponsiveCandidate = {
  render: renderCandidate,
};
