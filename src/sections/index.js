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

function setPetProjectTitle(project) {
  document.title = project ? project.title.toLocaleLowerCase("ru-RU") + " — пет-проект" : "иван крушинский";
}

function renderRoutedPage(target, html, footerHtml = "") {
  target.innerHTML = html + footerHtml;
}

export async function renderPage(target = document.getElementById("main")) {
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const pathname = normalizePathname();
  const petProjectSlug = getPetProjectSlug(pathname);

  if (petProjectSlug) {
    const [{ getPetProjectBySlug }, { renderPetProjectPage }, { renderSiteFooter }] = await Promise.all([
      import("./pet-projects/pet-project-data.js"),
      import("./pet-projects/pet-projects-renderer.js"),
      import("./site-footer/site-footer.js"),
    ]);

    setPetProjectTitle(getPetProjectBySlug(petProjectSlug));
    renderRoutedPage(target, renderPetProjectPage(petProjectSlug), renderSiteFooter());
    return;
  }

  if (pathname === RESUME_PATH) {
    const [{ renderResumePage }, { renderSiteFooter }] = await Promise.all([
      import("./resume/resume-renderer.js"),
      import("./site-footer/site-footer.js"),
    ]);

    setResumeTitle();
    renderRoutedPage(target, renderResumePage(), renderSiteFooter());
    return;
  }

  setHomeTitle();
}
