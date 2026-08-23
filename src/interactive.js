import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HERO_LETTER_EVENTS = [
  { type: "jump", index: 4, delay: 2.4, repeatDelay: 9.5, y: -8 },
  { type: "jump", index: 18, delay: 6.8, repeatDelay: 11.2, y: -8 },
  { type: "flip", index: 6, delay: 4.8, repeatDelay: 12 },
  { type: "wobble", index: 13, delay: 8.2, repeatDelay: 10.5, rotation: 6, y: -3 },
  { type: "stretch", index: 22, delay: 12.4, repeatDelay: 13.5, scaleX: 1.16, scaleY: 0.92 },
];

const TEXT_REVEAL = {
  y: 6,
  duration: 0.48,
  stagger: 0.055,
  ease: "power2.out",
};

const PROJECT_CARD_REVEAL = {
  scale: 0.985,
  duration: 0.68,
  stagger: 0.08,
  ease: "power2.out",
};

const MEDIA_REVEAL = {
  scale: 0.99,
  duration: 0.62,
  stagger: 0.07,
  ease: "power2.out",
};

const noop = () => {};

function isAuthoredHidden(element) {
  return element instanceof Element && Boolean(element.closest("[hidden]"));
}

function isInitiallyVisible(element) {
  if (!(element instanceof Element)) return false;

  const rect = element.getBoundingClientRect();

  return (
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  );
}

function uniqueElements(elements) {
  return [...new Set(elements)].filter(
    (element) => element instanceof HTMLElement && !isAuthoredHidden(element),
  );
}

function sortByDocumentOrder(elements) {
  return [...elements].sort((a, b) => {
    if (a === b) return 0;

    const position = a.compareDocumentPosition(b);

    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;

    return 0;
  });
}

function createViewportReveal({
  targets,
  ownerFor,
  initial,
  final,
  shouldAnimate = () => true,
  rootMargin = "0px 0px -8% 0px",
}) {
  const allTargets = uniqueElements(targets);
  if (!allTargets.length) return noop;

  const prepared = allTargets.filter((element) => !isInitiallyVisible(element));
  if (!prepared.length) return noop;

  gsap.set(prepared, initial);

  if (typeof IntersectionObserver !== "function") {
    gsap.set(prepared, {
      clearProps: "opacity,visibility,transform,translate,scale",
    });
    return noop;
  }

  const observed = new Set(prepared);
  const pending = new Map();
  const tweens = new Set();
  let flushFrame = 0;

  const revealImmediately = (element) => {
    observed.delete(element);
    observer.unobserve(element);
    gsap.set(element, {
      clearProps: "opacity,visibility,transform,translate,scale",
    });
  };

  const flush = () => {
    flushFrame = 0;

    for (const [owner, elements] of pending) {
      const batch = sortByDocumentOrder(elements).filter((element) => {
        if (!observed.has(element)) return false;

        if (!shouldAnimate(element)) {
          revealImmediately(element);
          return false;
        }

        observed.delete(element);
        observer.unobserve(element);
        return true;
      });

      if (!batch.length) continue;

      const tween = gsap.to(batch, {
        ...final,
        onComplete() {
          tweens.delete(tween);
        },
      });

      tweens.add(tween);
    }

    pending.clear();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const element = entry.target;
        if (!(element instanceof HTMLElement) || !observed.has(element)) {
          continue;
        }

        const owner = ownerFor(element) ?? element;
        const batch = pending.get(owner) ?? [];
        batch.push(element);
        pending.set(owner, batch);
      }

      if (pending.size && !flushFrame) {
        flushFrame = requestAnimationFrame(flush);
      }
    },
    {
      root: null,
      rootMargin,
      threshold: 0.01,
    },
  );

  prepared.forEach((element) => observer.observe(element));

  return () => {
    if (flushFrame) cancelAnimationFrame(flushFrame);

    observer.disconnect();
    pending.clear();
    observed.clear();

    tweens.forEach((tween) => tween.kill());
    tweens.clear();

    gsap.set(prepared, {
      clearProps: "opacity,visibility,transform,translate,scale",
    });
  };
}

function initHeroLetterMotion(root) {
  if (!(root instanceof HTMLElement)) return noop;

  const letters = [...root.querySelectorAll("[data-hero-letter]")];
  if (!letters.length) return noop;

  const hero = root.closest(".hero") ?? root;
  const timelines = [];

  const context = gsap.context(() => {
    gsap.set(letters, {
      transformOrigin: "50% 58%",
      transformPerspective: 900,
      force3D: true,
    });

    for (const event of HERO_LETTER_EVENTS) {
      const letter = letters[Math.abs(Math.trunc(event.index)) % letters.length];

      const timeline = gsap.timeline({
        paused: true,
        repeat: -1,
        repeatDelay: event.repeatDelay,
        delay: event.delay,
      });

      if (event.type === "flip") {
        timeline
          .to(letter, {
            rotationX: 180,
            duration: 0.4,
            ease: "power2.inOut",
          })
          .to(
            letter,
            {
              rotationX: 360,
              duration: 0.46,
              ease: "power2.inOut",
            },
            "+=.12",
          )
          .set(letter, { rotationX: 0 });
      } else if (event.type === "wobble") {
        const rotation = event.rotation ?? 5;
        const y = event.y ?? -2;

        timeline
          .to(letter, {
            rotation: -rotation,
            y,
            duration: 0.23,
            ease: "power1.out",
          })
          .to(letter, {
            rotation: rotation * 0.84,
            y: 1,
            duration: 0.28,
            ease: "power1.inOut",
          })
          .to(letter, {
            rotation: -rotation * 0.34,
            y: 0,
            duration: 0.24,
            ease: "power1.inOut",
          })
          .to(letter, {
            rotation: 0,
            y: 0,
            duration: 0.36,
            ease: "power2.out",
          });
      } else if (event.type === "stretch") {
        timeline
          .to(letter, {
            scaleX: event.scaleX ?? 1.08,
            scaleY: event.scaleY ?? 0.95,
            duration: 0.28,
            ease: "power2.out",
          })
          .to(
            letter,
            {
              scaleX: 1,
              scaleY: 1,
              duration: 0.44,
              ease: "power2.inOut",
            },
            "+=.06",
          );
      } else {
        timeline
          .to(letter, {
            y: event.y ?? -6,
            duration: 0.2,
            ease: "power2.out",
          })
          .to(
            letter,
            {
              y: 0,
              duration: 0.42,
              ease: "power2.inOut",
            },
            "+=.28",
          );
      }

      timelines.push(timeline);
    }
  }, root);

  let inViewport = false;

  const sync = () => {
    const active = inViewport && !document.hidden;

    timelines.forEach((timeline) => {
      if (active) timeline.resume();
      else timeline.pause();
    });
  };

  const trigger = ScrollTrigger.create({
    trigger: hero,
    start: "top bottom",
    end: "bottom top",
    onToggle(self) {
      inViewport = self.isActive;
      sync();
    },
  });

  const rect = hero.getBoundingClientRect();
  inViewport = rect.bottom > 0 && rect.top < window.innerHeight;
  sync();

  document.addEventListener("visibilitychange", sync);

  return () => {
    document.removeEventListener("visibilitychange", sync);
    trigger.kill();
    context.revert();
  };
}

function getTextRevealTargets(root) {
  const selectors = [
    ".projects-grid > h2",
    ".portfolio-showcase__head > h2",
    ".portfolio-showcase__head > p",
    ".expertise > h2",
    ".experience > h2",
    ".tools > h2",
    ".project__head > .project__name",
    ".project__head > .project__role",
    ".project__head > .project__period",
    ".project__intro > .project__title",
    ".project__intro > .project__summary",
    ".project__intro > .project__lead",
    ".project__intro > .project__links",
    ".section-copy > .section-copy__title",
    ".section-copy > .section-copy__text",
    ".project__section > h2",
    ".project__section > h3",
    ".project__section > p:not([class])",
    ".project__section > section > h2",
    ".project__section > section > h3",
    ".project__section > section > p:not([class])",
    ".media-group__head > h2",
    ".media-group__head > h3",
    ".media-group__head > p",
    ".brand-system__intro > p",
    ".jestei-section-copy-list > p",
    ".group-note",
    ".editorial-note",
    ".credits",
    ".feature-layout__copy",
    ".resource-row__copy",
    ".project__footer > *",
    ".contact > *",
  ];

  return uniqueElements(
    selectors.flatMap((selector) => [...root.querySelectorAll(selector)]),
  ).filter(
    (element) =>
      !element.closest(
        "[data-infinite-reel], [data-media-deck], .page-flip, .moves-awful-interactive, .awful-cases-game",
      ),
  );
}

function textRevealOwner(element) {
  return element.closest(
    ".project__head, .project__intro, .section-copy, .media-group__head, .brand-system__intro, .jestei-section-copy-list, .project__footer, .contact",
  );
}

function initTextReveals(root) {
  return createViewportReveal({
    targets: getTextRevealTargets(root),
    ownerFor: textRevealOwner,
    initial: {
      autoAlpha: 0,
      y: TEXT_REVEAL.y,
    },
    final: {
      autoAlpha: 1,
      y: 0,
      duration: TEXT_REVEAL.duration,
      stagger: TEXT_REVEAL.stagger,
      ease: TEXT_REVEAL.ease,
      clearProps: "opacity,visibility,transform",
    },
  });
}

function initProjectCardReveals(root) {
  const cards = [...root.querySelectorAll(".project-card")];

  return createViewportReveal({
    targets: cards,
    ownerFor: (element) => element.closest(".projects-grid__list"),
    initial: {
      autoAlpha: 0,
      scale: PROJECT_CARD_REVEAL.scale,
      transformOrigin: "50% 50%",
    },
    final: {
      autoAlpha: 1,
      scale: 1,
      duration: PROJECT_CARD_REVEAL.duration,
      stagger: PROJECT_CARD_REVEAL.stagger,
      ease: PROJECT_CARD_REVEAL.ease,
      clearProps: "opacity,visibility,transform",
    },
    rootMargin: "0px 0px -6% 0px",
  });
}

function isInsideExcludedMediaOwner(figure) {
  return Boolean(
    figure.closest(
      "[data-infinite-reel], [data-media-deck], [data-before-after], .before-after, .mockup, .page-flip, .moves-awful-interactive, .awful-cases-game, [data-animated-canvas-gallery]",
    ),
  );
}

function isStaticMediaFigure(figure) {
  if (!(figure instanceof HTMLElement) || !figure.matches("figure.media")) {
    return false;
  }

  if (isAuthoredHidden(figure) || isInsideExcludedMediaOwner(figure)) {
    return false;
  }

  if (figure.querySelector("video, canvas")) return false;

  return Boolean(
    figure.querySelector(":scope > .media__surface img, :scope > .media__surface picture"),
  );
}

function isInActiveHorizontalRail(figure) {
  if (!(figure instanceof HTMLElement)) return false;

  const rail = figure.closest(".reel");
  if (!(rail instanceof HTMLElement)) return false;

  return rail.scrollWidth > rail.clientWidth + 2;
}

function mediaRevealOwner(figure) {
  return figure.closest(".media-group") ?? figure.parentElement ?? figure;
}

function initStaticMediaReveals(root) {
  const figures = [...root.querySelectorAll("figure.media")].filter(
    isStaticMediaFigure,
  );

  return createViewportReveal({
    targets: figures,
    ownerFor: mediaRevealOwner,
    shouldAnimate: (figure) => !isInActiveHorizontalRail(figure),
    initial: {
      autoAlpha: 0,
      scale: MEDIA_REVEAL.scale,
      transformOrigin: "50% 50%",
    },
    final: {
      autoAlpha: 1,
      scale: 1,
      duration: MEDIA_REVEAL.duration,
      stagger: MEDIA_REVEAL.stagger,
      ease: MEDIA_REVEAL.ease,
      clearProps: "opacity,visibility,transform",
    },
  });
}

function initGsapMotionLayer(root) {
  const matchMedia = gsap.matchMedia();
  let destroyed = false;

  matchMedia.add("(prefers-reduced-motion: no-preference)", () => {
    const destroys = [];

    root.querySelectorAll("[data-hero-motion]").forEach((element) => {
      destroys.push(initHeroLetterMotion(element));
    });

    destroys.push(initTextReveals(root));
    destroys.push(initProjectCardReveals(root));
    destroys.push(initStaticMediaReveals(root));

    return () => {
      destroys
        .splice(0)
        .reverse()
        .forEach((destroy) => destroy?.());
    };
  });

  document.fonts?.ready?.then(() => {
    if (!destroyed) ScrollTrigger.refresh();
  });

  return () => {
    destroyed = true;
    matchMedia.revert();
  };
}

function initPlaylistFilter(host) {
  const root = host.shadowRoot;
  if (!root) return;

  const form = root.querySelector(".filter");
  if (!(form instanceof HTMLFormElement)) return;

  const cycle = (element) => {
    const current = element.dataset.selection || "neutral";
    element.dataset.selection =
      current === "neutral"
        ? "included"
        : current === "included"
          ? "excluded"
          : "neutral";
    form.dataset.hasFilters = "true";
  };

  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!(target instanceof Element)) return;

    const action = target.dataset.action;

    if (action === "toggle-open") {
      const open = form.dataset.filterOpen !== "false";
      form.dataset.filterOpen = String(!open);
      target.setAttribute("aria-expanded", String(!open));
    } else if (action === "toggle-advanced") {
      form.dataset.filterAdvanced = String(
        form.dataset.filterAdvanced !== "true",
      );
    } else if (
      action === "genre" ||
      action === "tag" ||
      action === "checkbox" ||
      action === "rating" ||
      action === "top" ||
      action === "key-toggle"
    ) {
      cycle(target);
    } else if (action === "reset") {
      root
        .querySelectorAll("[data-selection]")
        .forEach((element) => (element.dataset.selection = "neutral"));
      form.dataset.hasFilters = "false";
    } else if (action === "mode" && target instanceof HTMLInputElement) {
      root
        .querySelectorAll(".track-state__option")
        .forEach((label) => (label.dataset.state = "inactive"));
      target
        .closest(".track-state__option")
        ?.setAttribute("data-state", "active");
      form.dataset.mode = target.value;
    } else if (action === "drop-seed") {
      target.hidden = true;
    } else if (action === "key") {
      const dialog = root.querySelector("[data-key-dialog]");
      if (dialog instanceof HTMLDialogElement && !dialog.open) {
        dialog.showModal();
      }
    } else if (action === "key-cancel") {
      target.closest("dialog")?.close();
    } else if (action === "key-apply") {
      const dialog = target.closest("dialog");
      if (dialog instanceof HTMLDialogElement) dialog.close();
      form.dataset.hasFilters = "true";
    } else if (action === "key-clear") {
      const pill = root.querySelector("[data-key-selection-pill]");
      if (pill instanceof HTMLElement) pill.hidden = true;
      form.dataset.hasFilters = "true";
    } else if (action === "key-variant") {
      const classic = target.getAttribute("aria-pressed") === "true";
      target.setAttribute("aria-pressed", String(!classic));
      target.dataset.keyVariant = classic ? "camelot" : "classic";

      target.querySelectorAll("[data-key-variant-label]").forEach((label) => {
        label.dataset.state =
          label.dataset.keyVariantLabel === target.dataset.keyVariant
            ? "active"
            : "inactive";
      });
    }
  });

  form.addEventListener("submit", (event) => event.preventDefault());
}

function initJesteiFilterFit(mockup) {
  if (!(mockup instanceof HTMLElement)) return noop;

  const viewport = mockup.querySelector(".mockup__viewport");
  const filter = mockup.querySelector("playlist-filter-workflow");

  if (
    !(viewport instanceof HTMLElement) ||
    !(filter instanceof HTMLElement)
  ) {
    return noop;
  }

  const render = () => {
    const viewportStyles = getComputedStyle(viewport);
    const paddingInline =
      (Number.parseFloat(viewportStyles.paddingInlineStart) || 0) +
      (Number.parseFloat(viewportStyles.paddingInlineEnd) || 0);

    const availableWidth = Math.max(0, viewport.clientWidth - paddingInline);
    const designWidth = filter.offsetWidth;
    const designHeight = filter.offsetHeight;

    if (!availableWidth || !designWidth || !designHeight) return;

    const scale = Math.min(1, availableWidth / designWidth);

    mockup.style.setProperty("--filter-fit-scale", String(scale));
    mockup.style.setProperty(
      "--filter-fit-height",
      `${designHeight * scale}px`,
    );
  };

  const observer =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(render)
      : null;

  observer?.observe(viewport);
  render();

  return () => {
    observer?.disconnect();
    mockup.style.removeProperty("--filter-fit-scale");
    mockup.style.removeProperty("--filter-fit-height");
  };
}

export function initSiteInteractive({ root = document } = {}) {
  const destroys = [];

  destroys.push(initGsapMotionLayer(root));

  root.querySelectorAll("playlist-filter-workflow").forEach(initPlaylistFilter);

  root.querySelectorAll(".jestei-filter-mockup").forEach((mockup) => {
    destroys.push(initJesteiFilterFit(mockup));
  });

  return () =>
    destroys
      .splice(0)
      .reverse()
      .forEach((destroy) => destroy?.());
}
