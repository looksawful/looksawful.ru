import navigationHtml from "./navigation/navigation.html?raw";
import heroHtml from "./hero/hero.html?raw";
import cvHtml from "./cv/cv.html?raw";
import jesteiHtml from "./projects/jestei.html?raw";
import styxHtml from "./projects/styx.html?raw";
import extrasHtml from "./extras/music-shoots.html?raw";
import { mountJesteiInterfaceCases } from "./projects/interface-cases.js";
import { mountMusicShoots } from "./extras/music-shoots.js";
import { resolveSectionAssetUrls } from "./raw-assets.js";

const PROJECTS_SHELL = (content) => `\n<section class="projects" id="projects" aria-label="Выделенные проекты">\n${content}\n</section>`;
const EXTRAS_SHELL = (content) => `\n<section class="extras" id="extras" aria-label="Дополнительные кейсы">\n${content}\n</section>`;
const SECTION_HTML = (content) => resolveSectionAssetUrls(content).trim();

export function renderPage(target = document.getElementById("main")) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  target.innerHTML = [
    SECTION_HTML(navigationHtml),
    SECTION_HTML(heroHtml),
    SECTION_HTML(cvHtml),
    PROJECTS_SHELL([SECTION_HTML(jesteiHtml), SECTION_HTML(styxHtml)].join("\n")),
    EXTRAS_SHELL(SECTION_HTML(extrasHtml)),
  ].join("\n\n");
}

export function initSections() {
  mountJesteiInterfaceCases();
  mountMusicShoots();
}
