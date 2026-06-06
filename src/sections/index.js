import { getPetProjectBySlug } from "./pet-projects/pet-project-data.js";
import { renderPetProjectPage } from "./pet-projects/pet-projects-renderer.js";
import { renderResumePage } from "./resume/resume-renderer.js";
import { renderSiteFooter } from "./site-navigation/site-navigation.js";

const PET_PROJECT_PATH_PATTERN = /^\/pet-projects\/([^/]+)\/?$/;
const RESUME_PATH_PATTERN = /^\/resume\/?$/;

function getPetProjectSlug(pathname = window.location.pathname) {
  return pathname.match(PET_PROJECT_PATH_PATTERN)?.[1] ?? "";
}

function renderDocumentTitle(slug) {
  const project = getPetProjectBySlug(slug);

  document.title = project ? `${project.title.toLocaleLowerCase("ru-RU")} — пет-проект` : "иван крушинский";
}

export function renderPage(target = document.getElementById("main")) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const petProjectSlug = getPetProjectSlug();

  if (petProjectSlug) {
    renderDocumentTitle(petProjectSlug);
    target.innerHTML = `${renderPetProjectPage(petProjectSlug)}${renderSiteFooter()}`;
    return;
  }

  if (RESUME_PATH_PATTERN.test(window.location.pathname)) {
    document.title = "резюме — иван крушинский";
    target.innerHTML = `${renderResumePage()}${renderSiteFooter()}`;
    return;
  }

  renderDocumentTitle("");
}
