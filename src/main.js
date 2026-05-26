import "./styles/style.css";
import { mountJesteiColors } from "./components/jesteipool-colors/main.js";
import { mountAwfulHead } from "./components/awfulhead/awfulhead.js";
import { initGsapRevealHooks } from "./components/gsap-reveal/gsap-reveal.js";
import { initHeroTitleAnimation } from "./components/hero-title/hero-title.js";
import { initJesteiPoolAnimation } from "./components/jestei-pool-animation/jestei-pool-animation.js";
import { mountThreeCanvas } from "./threejs/app.js";
import { mountMacbookScene } from "./threejs/macbook-scene.js";
import { mountArc } from "./components/canvas-animations/arc.js";
import { mountSpiral } from "./components/canvas-animations/spiral.js";
import { mountLetters } from "./components/002-letters/mount.js";
import { mountJesteiInterfaceCases } from "./components/page-sections/interface-cases.js";
import { mountMusicShoots } from "./components/page-sections/music-shoots.js";
import { observeOnceVisible, toggleBodyClassByVisibility } from "./utils/observer.js";

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

  observeOnceVisible(
    lazyCanvases,
    (canvas) => {
      mountThreeCanvas(canvas);
    },
    {
      rootMargin: "75% 0px",
      threshold: 0,
    },
  );
}

document.addEventListener("DOMContentLoaded", () => {
  mountJesteiInterfaceCases();
  mountMusicShoots();
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
  mountJesteiColors("jestei-colors-container"); // ← вот здесь
  const lettersCanvas = document.getElementById("letters-canvas");
  if (lettersCanvas) mountLetters(lettersCanvas);
});

function mountMacbookSceneLazy() {
  const canvas = document.getElementById("jestei-laptop-canvas");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  observeOnceVisible(
    [canvas],
    () => {
      mountMacbookScene(canvas);
    },
    { rootMargin: "75% 0px", threshold: 0 },
  );
}

// function initProjectSectionScroll() {
//   const sections = [...document.querySelectorAll(".project > .screen")];

//   if (!sections.length) return;

//   let isLocked = false;
//   let touchStartY = 0;

//   const getCurrentSectionIndex = () => {
//     const viewportCenter = window.scrollY + window.innerHeight / 2;

//     return sections.findIndex((section) => {
//       const top = section.offsetTop;
//       const bottom = top + section.offsetHeight;
//       return viewportCenter >= top && viewportCenter < bottom;
//     });
//   };

//   const scrollToSection = (index) => {
//     const target = sections[index];

//     if (!target || isLocked) return;

//     isLocked = true;

//     target.scrollIntoView({
//       behavior: "smooth",
//       block: "start",
//     });

//     window.setTimeout(() => {
//       isLocked = false;
//     }, 850);
//   };

//   const handleWheel = (event) => {
//     const index = getCurrentSectionIndex();

//     if (index === -1) return;

//     const direction = Math.sign(event.deltaY);

//     if (direction === 0) return;

//     const nextIndex = index + direction;

//     if (nextIndex < 0 || nextIndex >= sections.length) return;

//     event.preventDefault();
//     scrollToSection(nextIndex);
//   };

//   const handleTouchStart = (event) => {
//     touchStartY = event.touches[0].clientY;
//   };

//   const handleTouchEnd = (event) => {
//     const index = getCurrentSectionIndex();

//     if (index === -1) return;

//     const touchEndY = event.changedTouches[0].clientY;
//     const delta = touchStartY - touchEndY;

//     if (Math.abs(delta) < 48) return;

//     const direction = Math.sign(delta);
//     const nextIndex = index + direction;

//     if (nextIndex < 0 || nextIndex >= sections.length) return;

//     scrollToSection(nextIndex);
//   };

//   window.addEventListener("wheel", handleWheel, { passive: false });
//   window.addEventListener("touchstart", handleTouchStart, { passive: true });
//   window.addEventListener("touchend", handleTouchEnd, { passive: true });
// }

// initProjectSectionScroll();
