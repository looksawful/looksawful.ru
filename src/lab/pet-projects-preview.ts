import "../styles/index.css";
import "../styles/pet-projects.css";
import "./pet-projects-preview.css";

import { createPetProjectReels } from "../components/pet-projects.ts";
import {
  petProjects,
  type ComingSoonPetProject,
  type HiddenPetProject,
  type LivePetProject,
  type PetProject,
  type PetProjectId,
} from "../data/pet-projects.ts";
import { renderMediaElement } from "../templates/media-figure.ts";
import { renderPetProjects, type RenderablePetProject } from "../templates/pet-project-card.ts";
import { renderProjectIntro } from "../templates/project-intro.ts";
import { escapeHtml } from "../utils/html.ts";

const AWFUL_STUDIO_CAPTURE =
  "https://raw.githubusercontent.com/looksawful/awful-studio/scene/ui-screens-v2/scene_lab/ui_screens_v2/white_studio_v2_rendered_ui.png";
const AWFUL_STUDIO_DARK_CAPTURE =
  "https://raw.githubusercontent.com/looksawful/awful-studio/scene/ui-screens-v2/scene_lab/ui_screens_v2/dark_neon_v2_rendered_ui.png";
const AWFUL_STUDIO_LOFT_CAPTURE =
  "https://raw.githubusercontent.com/looksawful/awful-studio/scene/ui-screens-v2/scene_lab/ui_screens_v2/loft_daylight_v2_rendered_ui.png";
const AWFUL_STUDIO_OVERVIEW =
  "https://raw.githubusercontent.com/looksawful/looksawful.ru/preview/pet-projects-awful-studio/public/prototypes/pet-projects-awful-studio/assets/awful-studio-overview.webp";
const AWFUL_STUDIO_LIGHTING =
  "https://raw.githubusercontent.com/looksawful/looksawful.ru/preview/pet-projects-awful-studio/public/prototypes/pet-projects-awful-studio/assets/awful-studio-lighting.webp";
const AWFUL_STUDIO_TUTORIAL =
  "https://raw.githubusercontent.com/looksawful/looksawful.ru/preview/pet-projects-awful-studio/public/prototypes/pet-projects-awful-studio/assets/awful-studio-tutorial.webp";

function requireProject<T extends PetProject["status"]>(
  id: PetProjectId,
  status: T,
): Extract<PetProject, { status: T }> {
  const project = petProjects.find((candidate) => candidate.id === id);
  if (!project || project.status !== status) {
    throw new Error(`Expected Pet Project ${id} with status ${status}`);
  }
  return project as Extract<PetProject, { status: T }>;
}

function renderAwfulCasesCover(): string {
  return `
    <div class="pet-project-cover pet-project-cover--awful-cases" aria-hidden="true">
      <div class="pet-awful-copy">
        <strong>AWFUL</strong>
        <small>cases</small>
        <div class="pet-awful-keys"><span>AA</span><span>aa</span><span>Aa</span></div>
      </div>
      <img src="/pets/awful-cases/assets/victory.png" alt="" loading="eager">
    </div>
  `;
}

function renderBerserkCover(): string {
  return `
    <div class="pet-project-cover pet-project-cover--berserk" aria-hidden="true">
      <div class="pet-berserk-window">
        <div class="pet-berserk-bar"><span>BERSERK TIMER</span><span>startup</span></div>
        <div class="pet-berserk-body">
          <pre class="pet-berserk-logo">██████╗ ███████╗██████╗ ███████╗███████╗██████╗ ██╗  ██╗
██╔══██╗██╔════╝██╔══██╗██╔════╝██╔════╝██╔══██╗██║ ██╔╝
██████╔╝█████╗  ██████╔╝███████╗█████╗  ██████╔╝█████╔╝</pre>
          <div class="pet-berserk-prompt"><span>&gt; duration</span><span>25 min</span></div>
          <div class="pet-berserk-prompt"><span>&gt; goal</span><span>focus</span></div>
        </div>
        <div class="pet-berserk-foot"><span>p pause</span><span>v log</span></div>
      </div>
    </div>
  `;
}

function renderAwfulStudioCover(): string {
  return `
    <div class="pet-project-cover pet-project-cover--awful-studio">
      <img src="${AWFUL_STUDIO_CAPTURE}" alt="" loading="eager">
    </div>
  `;
}

function renderPlaceholderCover(project: RenderablePetProject): string {
  return `
    <div class="pet-project-cover pet-project-cover--placeholder" aria-hidden="true">
      <span>${escapeHtml(project.title)}</span>
    </div>
  `;
}

function renderProjectCover(project: RenderablePetProject): string {
  switch (project.id) {
    case "awful-cases":
      return renderAwfulCasesCover();
    case "moves-awful":
      return renderMediaElement("moves-awful-jestei-landing-animation-01-use-01");
    case "berserk-timer":
      return renderBerserkCover();
    case "awful-studio":
      return renderAwfulStudioCover();
    default:
      return renderPlaceholderCover(project);
  }
}

function resolvePreviewHref(project: LivePetProject): string | undefined {
  if (project.id === "berserk-timer") return "/lab/pets/?view=berserk";
  if (project.id === "awful-studio") return "/lab/pets/?view=studio";
  return project.href;
}

function renderHomeView(): string {
  return `
    <main class="pet-prototype-page">
      ${renderPetProjects(petProjects, {
        renderCover: renderProjectCover,
        resolveHref: resolvePreviewHref,
        heading: "Полезное",
      })}
    </main>
  `;
}

function renderStatesView(): string {
  const awfulCases = requireProject("awful-cases", "live");
  const awfulStudio = requireProject("awful-studio", "live");
  const newStudio: LivePetProject = { ...awfulStudio, badge: "new" };
  const comingSoon: ComingSoonPetProject = {
    id: "awful-mockups",
    title: "Awful Mockups",
    kind: "asset-library",
    status: "coming-soon",
  };

  return `
    <main class="pet-prototype-page">
      <header class="pet-prototype-lab-note">
        <h1>Состояния карточки</h1>
        <p>Обычная ссылка, ручной NEW и некликабельный COMING SOON используют один DOM/CSS-компонент. Hidden-записи ниже намеренно отсутствуют в DOM.</p>
      </header>
      ${renderPetProjects([awfulCases, newStudio, comingSoon], {
        renderCover: renderProjectCover,
        resolveHref: resolvePreviewHref,
        heading: "Полезное",
        headingId: "pet-project-states-title",
      })}
      <p class="pet-prototype-hidden-state">hidden: ${petProjects.filter((project) => project.status === "hidden").length} roadmap records · rendered cards: 0</p>
    </main>
  `;
}

function previewHiddenAsComingSoon(project: HiddenPetProject): ComingSoonPetProject {
  return {
    id: project.id,
    title: project.title,
    kind: project.kind,
    status: "coming-soon",
  };
}

function renderCatalogView(): string {
  const capacityProjects: readonly (LivePetProject | ComingSoonPetProject)[] = petProjects.map((project) =>
    project.status === "hidden" ? previewHiddenAsComingSoon(project) : project,
  );

  return `
    <main class="pet-prototype-page">
      <header class="pet-prototype-lab-note">
        <h1>14-card capacity preview</h1>
        <p>Это stress-test будущего каталога, а не список для публикации. Десять roadmap-проектов здесь временно показаны как COMING SOON только для проверки переноса, ритма и адаптива.</p>
      </header>
      ${renderPetProjects(capacityProjects, {
        renderCover: renderProjectCover,
        resolveHref: resolvePreviewHref,
        heading: "Полезное",
        headingId: "pet-project-catalog-title",
      })}
    </main>
  `;
}

function renderPrototypeHeader(title: string): string {
  return `
    <header class="pet-prototype-site-header">
      <nav class="pet-prototype-breadcrumbs" aria-label="Хлебные крошки">
        <a href="/lab/pets/?view=home">Иван Крушинский</a>
        <span>/</span>
        <span>${escapeHtml(title)}</span>
      </nav>
      <span class="pet-prototype-site-mark" aria-hidden="true">⌁</span>
    </header>
  `;
}

function renderBerserkPage(): string {
  const intro = renderProjectIntro(
    {
      head: { type: "text", text: "Berserk Timer" },
      title: { type: "text", text: "Berserk Timer" },
      summary: "Консольный помодоро-таймер для Windows.",
      links: [
        {
          label: "GitHub",
          href: "https://github.com/looksawful/berserk-timer",
          rel: "noopener",
          target: "_blank",
        },
      ],
    },
    { headingLevel: 1 },
  );

  return `
    <div class="pet-prototype-page pet-prototype-project">
      ${renderPrototypeHeader("Berserk Timer")}
      <main>
        <article class="project" id="project-berserk-timer">
          ${intro}
          <section class="pet-prototype-project-media" aria-labelledby="berserk-interface-title">
            <h2 id="berserk-interface-title">Интерфейс</h2>
            <div class="pet-prototype-project-hero">${renderBerserkCover()}</div>
            <div class="pet-prototype-screen-grid" data-columns="3">
              <div class="pet-prototype-screen">
                <div class="pet-prototype-terminal-screen">
                  <strong>TIMER FINISHED</strong>
                  <span>25:00 · completed</span>
                  <span>goal: focus</span>
                  <span>&gt; What did you accomplish?</span>
                  <span>_</span>
                </div>
              </div>
              <div class="pet-prototype-screen">
                <div class="pet-prototype-terminal-screen">
                  <strong>AUDIO SETTINGS</strong>
                  <span>volume ........ 80%</span>
                  <span>alert sound ... bell</span>
                  <span>preview ....... enter</span>
                </div>
              </div>
              <div class="pet-prototype-screen">
                <div class="pet-prototype-terminal-screen">
                  <strong>HELP / COMMANDS</strong>
                  <span>p · pause / resume</span>
                  <span>v · today log</span>
                  <span>q · quit</span>
                  <span>esc · back</span>
                </div>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>
  `;
}

function renderAwfulStudioPage(): string {
  const intro = renderProjectIntro(
    {
      head: { type: "text", text: "AWFUL STUDIO" },
      title: { type: "text", text: "AWFUL STUDIO" },
      summary: "Расширение Blender для сборки виртуальной предметной студии.",
      links: [
        {
          label: "GitHub",
          href: "https://github.com/looksawful/awful-studio",
          rel: "noopener",
          target: "_blank",
        },
        {
          label: "Releases",
          href: "https://github.com/looksawful/awful-studio/releases",
          rel: "noopener",
          target: "_blank",
        },
      ],
    },
    { headingLevel: 1 },
  );

  return `
    <div class="pet-prototype-page pet-prototype-project">
      ${renderPrototypeHeader("AWFUL STUDIO")}
      <main>
        <article class="project" id="project-awful-studio">
          ${intro}
          <section class="pet-prototype-project-media" aria-labelledby="awful-studio-scenes-title">
            <h2 id="awful-studio-scenes-title">Сцены и режимы</h2>
            <div class="pet-prototype-project-hero">
              <img src="${AWFUL_STUDIO_CAPTURE}" alt="AWFUL STUDIO в Blender 5.2" loading="eager">
            </div>
            <div class="pet-prototype-studio-strip" aria-label="Примеры сцен AWFUL STUDIO">
              <figure>
                <img src="${AWFUL_STUDIO_CAPTURE}" alt="Белая предметная студия в Blender" loading="lazy">
                <figcaption>White Studio</figcaption>
              </figure>
              <figure>
                <img src="${AWFUL_STUDIO_LOFT_CAPTURE}" alt="Loft Daylight в Blender" loading="lazy">
                <figcaption>Loft Daylight</figcaption>
              </figure>
              <figure>
                <img src="${AWFUL_STUDIO_DARK_CAPTURE}" alt="Dark Neon в Blender" loading="lazy">
                <figcaption>Dark Neon</figcaption>
              </figure>
            </div>
          </section>
          <section class="pet-prototype-project-media" aria-labelledby="awful-studio-system-title">
            <h2 id="awful-studio-system-title">Система</h2>
            <div class="pet-prototype-screen-grid" data-columns="3">
              <div class="pet-prototype-screen"><img src="${AWFUL_STUDIO_OVERVIEW}" alt="Обзор AWFUL STUDIO" loading="lazy"></div>
              <div class="pet-prototype-screen"><img src="${AWFUL_STUDIO_LIGHTING}" alt="Схемы света AWFUL STUDIO" loading="lazy"></div>
              <div class="pet-prototype-screen"><img src="${AWFUL_STUDIO_TUTORIAL}" alt="AWFUL STUDIO tutorial sheet" loading="lazy"></div>
            </div>
          </section>
        </article>
      </main>
    </div>
  `;
}

const root = document.querySelector<HTMLElement>("#pet-projects-preview-root");
if (!root) throw new Error("Missing #pet-projects-preview-root");

const view = new URLSearchParams(location.search).get("view") ?? "home";
const html = view === "states"
  ? renderStatesView()
  : view === "catalog"
    ? renderCatalogView()
    : view === "berserk"
      ? renderBerserkPage()
      : view === "studio"
        ? renderAwfulStudioPage()
        : renderHomeView();

root.innerHTML = html;
const destroyReels = createPetProjectReels(root);
window.addEventListener("pagehide", destroyReels, { once: true });
