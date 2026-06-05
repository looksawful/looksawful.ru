import { gsap } from "gsap";
import { mountawfulface } from "../awfulface/awfulface.js";

const SIDEBAR_CLASS = "cv-context-sidebar";
const VISIBLE_CLASS = "is-visible";
const DESKTOP_QUERY = "(min-width: 68.01rem)";
const HOME_PATH_PATTERN = /^\/(?:index\.html)?$/;
const SIDEBAR_LINKS = [
  { id: "hero", label: "иван крушинский", type: "intro" },
  { id: "cv-jesteipool", label: "джести пул", type: "project" },
  { id: "cv-styx-jewels", label: "стикс джевел", type: "project" },
  { id: "cv-lyve-moscow", label: "лив москоу", type: "project" },
  { id: "pet-projects", label: "пет-проекты", type: "pet" },
];

function getProjectTitle(article) {
  return article?.querySelector("h3")?.textContent?.trim() || "проект";
}

function getActiveElement(elements, viewportRatio) {
  const anchor = window.innerHeight * viewportRatio;

  return (
    elements.find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top <= anchor && rect.bottom >= anchor;
    }) ?? elements.find((element) => element.getBoundingClientRect().top > anchor) ?? elements[elements.length - 1]
  );
}

function buildSidebar() {
  const aside = document.createElement("aside");

  aside.className = SIDEBAR_CLASS;
  aside.setAttribute("aria-label", "проекты");
  aside.innerHTML = `
    <div class="cv-context-sidebar__rail" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="cv-context-sidebar__panel">
      <div class="cv-context-sidebar__face" id="awfulface-sidebar"></div>
      <nav class="cv-context-sidebar__list" aria-label="проекты">
        ${SIDEBAR_LINKS.map(
          (link) => `
            <a href="#${link.id}" data-sidebar-target="${link.id}" data-sidebar-type="${link.type}">${link.label}</a>
          `,
        ).join("")}
      </nav>
    </div>
  `;

  document.body.appendChild(aside);
  mountawfulface("awfulface-sidebar", { variant: "inline", fallOnScroll: false, eyeStrength: 0.75 });
  return aside;
}

export function initCvSidebar(root = document) {
  const cv = root.querySelector("#cv");

  if (
    !(cv instanceof HTMLElement) ||
    cv.classList.contains("cv-section--resume") ||
    !HOME_PATH_PATTERN.test(window.location.pathname) ||
    document.querySelector(`.${SIDEBAR_CLASS}`)
  ) {
    return;
  }

  const media = window.matchMedia(DESKTOP_QUERY);
  const observedSections = SIDEBAR_LINKS.map((link) => document.getElementById(link.id)).filter(
    (element) => element instanceof HTMLElement,
  );
  const sidebar = buildSidebar();
  const projectList = sidebar.querySelector(".cv-context-sidebar__list");
  let isVisible = false;
  const projectLinks = [...(projectList?.querySelectorAll("a") ?? [])];

  gsap.set(sidebar, { autoAlpha: 0, x: 12 });

  const setVisible = (nextVisible) => {
    if (isVisible === nextVisible) {
      return;
    }

    isVisible = nextVisible;
    sidebar.classList.toggle(VISIBLE_CLASS, nextVisible);
    gsap.to(sidebar, {
      autoAlpha: nextVisible ? 1 : 0,
      x: nextVisible ? 0 : 16,
      duration: 0.24,
      ease: "power2.out",
      overwrite: true,
    });
  };

  const update = () => {
    if (!media.matches) {
      setVisible(false);
      return;
    }

    const cvRect = cv.getBoundingClientRect();
    const pet = document.getElementById("pet-projects");
    const petRect = pet?.getBoundingClientRect();
    const cvVisible = cvRect.top <= window.innerHeight * 0.46 && cvRect.bottom >= window.innerHeight * 0.2;
    const petVisible = Boolean(petRect && petRect.top <= window.innerHeight * 0.58 && petRect.bottom >= window.innerHeight * 0.16);
    const activeProject = getActiveElement(observedSections, 0.34);

    projectLinks.forEach((link) => {
      const isActive = activeProject instanceof HTMLElement && link.hash === `#${activeProject.id}`;
      link.classList.toggle("is-active", isActive);
    });

    setVisible(Boolean((cvVisible || petVisible) && activeProject));
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  media.addEventListener?.("change", update);

  return () => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
    media.removeEventListener?.("change", update);
    sidebar.remove();
  };
}
