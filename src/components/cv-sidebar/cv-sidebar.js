import { gsap } from "gsap";

const SIDEBAR_CLASS = "cv-context-sidebar";
const VISIBLE_CLASS = "is-visible";
const DESKTOP_QUERY = "(min-width: 68.01rem)";

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
    <nav class="cv-context-sidebar__list" aria-label="проекты"></nav>
  `;

  document.body.appendChild(aside);
  return aside;
}

export function initCvSidebar(root = document) {
  const cv = root.querySelector("#cv");

  if (!(cv instanceof HTMLElement) || document.querySelector(`.${SIDEBAR_CLASS}`)) {
    return;
  }

  const media = window.matchMedia(DESKTOP_QUERY);
  const sidebar = buildSidebar();
  const projectList = sidebar.querySelector(".cv-context-sidebar__list");
  let isVisible = false;
  let projectLinks = [];

  gsap.set(sidebar, { autoAlpha: 0, x: 16 });

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
    const cvVisible = cvRect.top <= window.innerHeight * 0.45 && cvRect.bottom >= window.innerHeight * 0.28;
    const projects = [...cv.querySelectorAll(".cv-experience > article")];
    const activeProject = getActiveElement(projects, 0.34);

    if (projectList && projectLinks.length !== projects.length) {
      projectList.innerHTML = projects
        .map((project, index) => {
          const id = project.id || `cv-project-${index + 1}`;
          project.id = id;

          return `<a href="#${id}">${getProjectTitle(project)}</a>`;
        })
        .join("");
      projectLinks = [...projectList.querySelectorAll("a")];
    }

    projectLinks.forEach((link) => {
      link.classList.toggle("is-active", activeProject instanceof HTMLElement && link.hash === `#${activeProject.id}`);
    });

    setVisible(Boolean(cvVisible && activeProject));
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
