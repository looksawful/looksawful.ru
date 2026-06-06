import { getPetProjectBySlug } from "./pet-projects/pet-project-data.js";
import { renderPetProjectPage } from "./pet-projects/pet-projects-renderer.js";
import { renderResumePage } from "./resume/resume-renderer.js";
import { renderSiteFooter } from "./site-footer/site-footer.js";

const PET_PROJECT_PATH_PATTERN = /^\/pet-projects\/([^/]+)$/;
const RESUME_PATH = "/resume";

function normalizePathname(pathname = window.location.pathname) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

function getPetProjectSlug(pathname) {
  return pathname.match(PET_PROJECT_PATH_PATTERN)?.[1] ?? "";
}

function setHomeTitle() {
  document.title = "иван крушинский";
}

function setResumeTitle() {
  document.title = "резюме — иван крушинский";
}

function setPetProjectTitle(slug) {
  const project = getPetProjectBySlug(slug);
  document.title = project ? `${project.title.toLocaleLowerCase("ru-RU")} — пет-проект` : "иван крушинский";
}

function renderRoutedPage(target, html) {
  target.innerHTML = `${html}${renderSiteFooter()}`;
}

export function renderPage(target = document.getElementById("main")) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const pathname = normalizePathname();
  const petProjectSlug = getPetProjectSlug(pathname);

  if (petProjectSlug) {
    setPetProjectTitle(petProjectSlug);
    renderRoutedPage(target, renderPetProjectPage(petProjectSlug));
    return;
  }

  if (pathname === RESUME_PATH) {
    setResumeTitle();
    renderRoutedPage(target, renderResumePage());
    return;
  }

  setHomeTitle();
}
