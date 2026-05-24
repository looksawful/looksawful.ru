import "./styles/variables.css";
import "./styles/base.css";
import "./styles/animations.css";
import "./styles/media.css";
import "./styles/layout.css";
import "./styles/style.css";
import { mountAwfulHead } from "./components/awfulhead/awfulhead.js";
import { initGsapRevealHooks } from "./components/gsap-reveal/gsap-reveal.js";
import { initHeroTitleAnimation } from "./components/hero-title/hero-title.js";
import { initJesteiPoolAnimation } from "./components/jestei-pool-animation/jestei-pool-animation.js";
import { mountThreeCanvas } from "./threejs/app.js";
import { mountMacbookScene } from "./threejs/macbook-scene.js";
import { mountArc } from "./components/canvas-animations/arc.js";
import { mountSpiral } from "./components/canvas-animations/spiral.js";
import { mountLetters } from "./components/002-letters/mount.js";

const THREE_CANVAS_TARGETS = ["#three-canvas"];

function isSidebarEnabled() {
  return Boolean(document.querySelector(".sidebar:not(.sidebar--disabled)"));
}

function mountFaces() {
  mountAwfulHead("awfulhead-hero", { fallOnScroll: true });
}

function initProjectNav() {
  const navLinks = [...document.querySelectorAll(".project-nav .nav-item[href^='#']")];
  const projects = navLinks
    .map((link) => ({
      link,
      section: document.getElementById(link.hash.slice(1)),
    }))
    .filter(({ section }) => section);

  if (!projects.length) {
    return;
  }

  function updateActiveProject() {
    const viewportAnchor = window.innerHeight * 0.45;
    const activeProject =
      projects.find(({ section }) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= viewportAnchor && rect.bottom >= viewportAnchor;
      }) ??
      projects.find(({ section }) => section.getBoundingClientRect().top > viewportAnchor) ??
      projects[projects.length - 1];

    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link === activeProject.link);
    });
  }

  updateActiveProject();
  window.addEventListener("scroll", updateActiveProject, { passive: true });
  window.addEventListener("resize", updateActiveProject);
}

function initSidebarVisibilityZones() {
  const zones = [...document.querySelectorAll("[data-sidebar-hidden-zone]")];

  if (!zones.length || !("IntersectionObserver" in window)) {
    return;
  }

  const activeZones = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeZones.add(entry.target);
          return;
        }

        activeZones.delete(entry.target);
      });

      document.body.classList.toggle("is-sidebar-hidden", activeZones.size > 0);
    },
    {
      rootMargin: "-18% 0px -32% 0px",
      threshold: 0,
    },
  );

  zones.forEach((zone) => observer.observe(zone));
}

function initProjectSidebarState() {
  const projects = [...document.querySelectorAll(".project")];

  if (!projects.length || !("IntersectionObserver" in window)) {
    return;
  }

  const visibleProjects = new Set();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleProjects.add(entry.target);
          return;
        }

        visibleProjects.delete(entry.target);
      });

      document.body.classList.toggle("is-project-visible", visibleProjects.size > 0);
    },
    {
      rootMargin: "-12% 0px -45% 0px",
      threshold: 0,
    },
  );

  projects.forEach((project) => observer.observe(project));
}

function mountThreeScenes() {
  const canvases = THREE_CANVAS_TARGETS.map((target) => document.querySelector(target)).filter(
    (canvas) => canvas instanceof HTMLCanvasElement,
  );

  const lazyCanvases = canvases.filter((canvas) => canvas.dataset.threeScene === "laptop");
  const eagerCanvases = canvases.filter((canvas) => !lazyCanvases.includes(canvas));

  eagerCanvases.forEach((canvas) => {
    mountThreeCanvas(canvas);
  });

  if (!lazyCanvases.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    lazyCanvases.forEach((canvas) => {
      mountThreeCanvas(canvas);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        mountThreeCanvas(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "75% 0px",
      threshold: 0,
    },
  );

  lazyCanvases.forEach((canvas) => {
    observer.observe(canvas);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initGsapRevealHooks();
  initHeroTitleAnimation();
  initJesteiPoolAnimation();
  mountFaces();

  if (isSidebarEnabled()) {
    initProjectNav();
    initProjectSidebarState();
    initSidebarVisibilityZones();
  }

  mountThreeScenes();
  mountMacbookSceneLazy();
  mountArc("arc-container");
  mountSpiral("spiral-container");

  const lettersCanvas = document.getElementById("letters-canvas");
  if (lettersCanvas) mountLetters(lettersCanvas);
});

function mountMacbookSceneLazy() {
  const canvas = document.getElementById("jestei-laptop-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  if (!("IntersectionObserver" in window)) {
    mountMacbookScene(canvas);
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      mountMacbookScene(canvas);
      obs.disconnect();
    },
    { rootMargin: "75% 0px", threshold: 0 },
  );
  obs.observe(canvas);
}
