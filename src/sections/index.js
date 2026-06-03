import heroHtml from "./hero/hero.html?raw";
import leadHtml from "./lead/lead.html?raw";
import cvHtml from "./cv/cv.html?raw";
import { getPetProjectBySlug } from "./pet-projects/pet-project-data.js";
import { renderPetProjectPage } from "./pet-projects/pet-projects-renderer.js";
import { renderResumePage } from "./resume/resume-renderer.js";
import { renderSiteNavigation } from "./site-navigation/site-navigation.js";

const SECTION_HTML = (content) => content.trim();
const PET_PROJECT_PATH_PATTERN = /^\/pet-projects\/([^/]+)\/?$/;
const RESUME_PATH_PATTERN = /^\/resume\/?$/;

function getPetProjectSlug(pathname = window.location.pathname) {
  return pathname.match(PET_PROJECT_PATH_PATTERN)?.[1] ?? "";
}

function renderDocumentTitle(slug) {
  const project = getPetProjectBySlug(slug);
  document.title = project ? `${project.title} — пет-проект` : "Иван Крушинский";
}

export function renderPage(target = document.getElementById("main")) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const petProjectSlug = getPetProjectSlug();

  if (petProjectSlug) {
    renderDocumentTitle(petProjectSlug);
    target.innerHTML = `${renderSiteNavigation("projects")}${renderPetProjectPage(petProjectSlug)}`;
    return;
  }

  if (RESUME_PATH_PATTERN.test(window.location.pathname)) {
    document.title = "Резюме — Иван Крушинский";
    target.innerHTML = `${renderSiteNavigation("resume")}${renderResumePage()}`;
    return;
  }

  renderDocumentTitle("");
  target.innerHTML = [renderSiteNavigation("home"), SECTION_HTML(heroHtml), SECTION_HTML(leadHtml), SECTION_HTML(cvHtml)].join(
    "\n\n",
  );
}
