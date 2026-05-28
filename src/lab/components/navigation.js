import { toggleBodyClassByVisibility } from "../shared/observer.js";

function isNavigationEnabled() {
  return Boolean(document.querySelector(".sidebar:not(.sidebar--disabled)"));
}

function initProjectNav() {
  const navLinks = [...document.querySelectorAll(".project-nav .nav-item[href^='#']")];
  const sections = navLinks
    .map((link) => ({
      link,
      section: document.getElementById(link.hash.slice(1)),
    }))
    .filter(({ section }) => section instanceof HTMLElement);

  if (!sections.length) {
    return;
  }

  const updateActiveSection = () => {
    const viewportAnchor = window.innerHeight * 0.45;
    const activeSection =
      sections.find(({ section }) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= viewportAnchor && rect.bottom >= viewportAnchor;
      }) ??
      sections.find(({ section }) => section.getBoundingClientRect().top > viewportAnchor) ??
      sections[sections.length - 1];

    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link === activeSection.link);
    });
  };

  updateActiveSection();
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection);
}

function initSidebarVisibilityZones() {
  const zones = [...document.querySelectorAll("[data-sidebar-hidden-zone]")];

  toggleBodyClassByVisibility(zones, "is-sidebar-hidden", {
    rootMargin: "-18% 0px -32% 0px",
    threshold: 0,
  });
}

function initProjectSidebarState() {
  const projects = [...document.querySelectorAll(".project")];

  toggleBodyClassByVisibility(projects, "is-project-visible", {
    rootMargin: "-12% 0px -45% 0px",
    threshold: 0,
  });
}

export function initNavigation() {
  if (!isNavigationEnabled()) {
    return;
  }

  initProjectNav();
  initProjectSidebarState();
  initSidebarVisibilityZones();
}
