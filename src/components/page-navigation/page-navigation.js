const NAV_VISIBLE_CLASS = "has-page-nav-visible";
const NAV_CV_CLASS = "is-page-nav-cv";
const ACTIVE_CLASS = "is-active";
const PROJECT_ACTIVE_CLASS = "is-project-active";
const TOP_BUTTON_VISIBLE_CLASS = "is-visible";
const PAGE_NAV_ENABLED = false;
const PROJECT_NAV_ENABLED = false;
const SECTION_LINKS = [
  { id: "hero", label: "обо мне" },
  { id: "lead", label: "что я умею" },
  { id: "cv", label: "где я работал" },
];
const PROJECT_ID_BY_TITLE = new Map([
  ["jesteipool", "cv-jesteipool"],
  ["Styx Jewels", "cv-styx-jewels"],
  ["Lyve Moscow", "cv-lyve-moscow"],
  ["Sensetique photostudio", "cv-sensetique-photostudio"],
  ["Mad Cow Films", "cv-madcow-films"],
  ["Sensetique production", "cv-sensetique-production"],
  ["LI-NE Agency", "cv-line-agency"],
  ["Издательство Прогресс", "cv-progress-publishing"],
  ["РИА НОВОСТИ газета Московские новости", "cv-ria-news"],
]);

function createLink({ id, label, className }) {
  const link = document.createElement("a");

  link.className = className;
  link.href = `#${id}`;
  link.textContent = label;

  return link;
}

function getSectionTargets() {
  return SECTION_LINKS.map((item) => ({
    ...item,
    element: document.getElementById(item.id),
  })).filter(({ element }) => element instanceof HTMLElement);
}

function getProjectTargets() {
  const projects = [...document.querySelectorAll(".cv-experience > article")];

  return projects
    .map((project, index) => {
      const title = project.querySelector("h3")?.textContent?.trim();

      if (!title) {
        return null;
      }

      project.id = project.id || PROJECT_ID_BY_TITLE.get(title) || `cv-project-${index + 1}`;

      return {
        id: project.id,
        label: title,
        element: project,
      };
    })
    .filter(Boolean);
}

function getActiveTarget(targets, viewportRatio = 0.42) {
  const viewportAnchor = window.innerHeight * viewportRatio;

  return (
    targets.find(({ element }) => {
      const rect = element.getBoundingClientRect();
      return rect.top <= viewportAnchor && rect.bottom >= viewportAnchor;
    }) ??
    targets.find(({ element }) => element.getBoundingClientRect().top > viewportAnchor) ??
    targets[targets.length - 1]
  );
}

function buildNavigation(sectionTargets, projectTargets) {
  const nav = document.createElement("nav");
  const primaryList = document.createElement("div");
  const projectList = PROJECT_NAV_ENABLED ? document.createElement("div") : null;

  nav.className = "page-nav";
  nav.setAttribute("aria-label", "Навигация по странице");
  primaryList.className = "page-nav__primary";

  sectionTargets.forEach((item) => {
    primaryList.appendChild(createLink({ ...item, className: "page-nav__link" }));
  });

  if (projectList) {
    projectList.className = "page-nav__projects";
    projectList.setAttribute("aria-label", "Проекты");

    projectTargets.forEach((item) => {
      projectList.appendChild(createLink({ ...item, className: "page-nav__project" }));
    });
  }

  nav.append(primaryList);

  if (projectList) {
    nav.appendChild(projectList);
  }

  document.body.appendChild(nav);

  return nav;
}

function buildTopButton() {
  const button = document.createElement("button");

  button.className = "page-top-button";
  button.type = "button";
  button.textContent = "наверх";
  button.setAttribute("aria-label", "Наверх");
  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  document.body.appendChild(button);

  return button;
}

function setActiveLink(links, activeId) {
  links.forEach((link) => {
    link.classList.toggle(ACTIVE_CLASS, link.hash === `#${activeId}`);
  });
}

export function initPageNavigation() {
  if (!PAGE_NAV_ENABLED || document.querySelector(".page-nav")) {
    return;
  }

  const sectionTargets = getSectionTargets();
  const projectTargets = PROJECT_NAV_ENABLED ? getProjectTargets() : [];
  const lead = document.getElementById("lead");
  const cv = document.getElementById("cv");

  if (!sectionTargets.length || !(lead instanceof HTMLElement)) {
    return;
  }

  const nav = buildNavigation(sectionTargets, projectTargets);
  const topButton = buildTopButton();
  const sectionLinks = [...nav.querySelectorAll(".page-nav__link")];
  const projectLinks = [...nav.querySelectorAll(".page-nav__project")];

  const updateNavigationState = () => {
    const leadRect = lead.getBoundingClientRect();
    const cvRect = cv?.getBoundingClientRect();
    const shouldShowNav = leadRect.top <= window.innerHeight * 0.72;
    const isCvVisible =
      cvRect && cvRect.top <= window.innerHeight * 0.58 && cvRect.bottom >= window.innerHeight * 0.2;
    const activeSection = getActiveTarget(sectionTargets);
    const activeProject = PROJECT_NAV_ENABLED && isCvVisible ? getActiveTarget(projectTargets, 0.36) : null;

    document.documentElement.classList.toggle(NAV_VISIBLE_CLASS, shouldShowNav);
    document.documentElement.classList.toggle(NAV_CV_CLASS, PROJECT_NAV_ENABLED && Boolean(isCvVisible));
    topButton.classList.toggle(TOP_BUTTON_VISIBLE_CLASS, window.scrollY > window.innerHeight * 0.65);

    if (activeSection) {
      setActiveLink(sectionLinks, activeSection.id);
    }

    projectLinks.forEach((link) => {
      link.classList.toggle(PROJECT_ACTIVE_CLASS, Boolean(activeProject) && link.hash === `#${activeProject.id}`);
    });
  };

  updateNavigationState();
  window.addEventListener("scroll", updateNavigationState, { passive: true });
  window.addEventListener("resize", updateNavigationState);
}
