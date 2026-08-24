import { gsap } from "gsap";

import {
  REVEAL_ATTRIBUTE,
  REVEAL_GROUP_ATTRIBUTE,
  REVEAL_KINDS,
  REVEAL_RAIL_ATTRIBUTE,
  type RevealKind,
} from "./motion-contract.ts";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: no-preference)";
const CLEAR_REVEAL_PROPS = "opacity,visibility,transform,translate,scale";
const noop = () => {};

type MotionRoot = ParentNode;

type InitMotionOptions = {
  root?: MotionRoot;
};

type RevealPreset = {
  initial: gsap.TweenVars;
  final: gsap.TweenVars;
};

const REVEAL_PRESETS = {
  copy: {
    initial: {
      autoAlpha: 0,
      y: 6,
    },

    final: {
      autoAlpha: 1,
      y: 0,
      duration: 0.48,
      stagger: 0.055,
      ease: "power2.out",
    },
  },

  media: {
    initial: {
      autoAlpha: 0,
      scale: 0.99,
      transformOrigin: "50% 50%",
    },

    final: {
      autoAlpha: 1,
      scale: 1,
      duration: 0.62,
      stagger: 0.07,
      ease: "power2.out",
    },
  },

  card: {
    initial: {
      autoAlpha: 0,
      scale: 0.985,
      transformOrigin: "50% 50%",
    },

    final: {
      autoAlpha: 1,
      scale: 1,
      duration: 0.68,
      stagger: 0.08,
      ease: "power2.out",
    },
  },
} satisfies Record<RevealKind, RevealPreset>;

const HERO_LETTER_EVENTS = [
  { type: "jump", index: 4, delay: 2.4, repeatDelay: 9.5, y: -8 },
  { type: "jump", index: 18, delay: 6.8, repeatDelay: 11.2, y: -8 },
  { type: "flip", index: 6, delay: 4.8, repeatDelay: 12 },
  { type: "wobble", index: 13, delay: 8.2, repeatDelay: 10.5, rotation: 6, y: -3 },
  { type: "stretch", index: 22, delay: 12.4, repeatDelay: 13.5, scaleX: 1.16, scaleY: 0.92 },
] as const;

function isAuthoredHidden(element: Element): boolean {
  return Boolean(element.closest("[hidden]"));
}

function isElementInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const viewport = element.ownerDocument.documentElement;

  return (
    rect.bottom > 0 &&
    rect.top < viewport.clientHeight &&
    rect.right > 0 &&
    rect.left < viewport.clientWidth
  );
}

function revealKindFor(element: Element): RevealKind | null {
  const value = element.getAttribute(REVEAL_ATTRIBUTE);

  return REVEAL_KINDS.includes(value as RevealKind) ? (value as RevealKind) : null;
}

function sortByDocumentOrder(elements: readonly HTMLElement[]): HTMLElement[] {
  return [...elements].sort((a, b) => {
    if (a === b) return 0;

    const position = a.compareDocumentPosition(b);

    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;

    return 0;
  });
}

function revealGroupFor(element: HTMLElement): HTMLElement {
  const group = element.closest(`[${REVEAL_GROUP_ATTRIBUTE}]`);

  return group instanceof HTMLElement ? group : element;
}

function isActiveHorizontalRail(rail: HTMLElement): boolean {
  const styles = getComputedStyle(rail);
  const overflowAllowsScrolling =
    styles.overflowX === "auto" || styles.overflowX === "scroll";

  return overflowAllowsScrolling && rail.scrollWidth > rail.clientWidth + 2;
}

function activeRevealRailFor(element: HTMLElement): HTMLElement | null {
  const rail = element.closest(`[${REVEAL_RAIL_ATTRIBUTE}]`);

  if (!(rail instanceof HTMLElement)) {
    return null;
  }

  return isActiveHorizontalRail(rail) ? rail : null;
}

function pushPreparedTarget(
  targetsByKind: Map<RevealKind, HTMLElement[]>,
  kind: RevealKind,
  element: HTMLElement,
): void {
  const targets = targetsByKind.get(kind) ?? [];
  targets.push(element);
  targetsByKind.set(kind, targets);
}

function queueRevealTarget(
  pending: Map<HTMLElement, Map<RevealKind, HTMLElement[]>>,
  target: HTMLElement,
  kind: RevealKind,
): void {
  const group = revealGroupFor(target);
  const groupTargets = pending.get(group) ?? new Map<RevealKind, HTMLElement[]>();
  const kindTargets = groupTargets.get(kind) ?? [];

  kindTargets.push(target);
  groupTargets.set(kind, kindTargets);
  pending.set(group, groupTargets);
}

function removePendingTargets(
  pending: Map<HTMLElement, Map<RevealKind, HTMLElement[]>>,
  targets: readonly HTMLElement[],
): void {
  const targetSet = new Set(targets);

  for (const [group, groupTargets] of pending) {
    for (const [kind, kindTargets] of groupTargets) {
      const filtered = kindTargets.filter((target) => !targetSet.has(target));

      if (filtered.length) {
        groupTargets.set(kind, filtered);
      } else {
        groupTargets.delete(kind);
      }
    }

    if (!groupTargets.size) {
      pending.delete(group);
    }
  }
}

function createGlobalReveals(root: MotionRoot): () => void {
  const targets = [...root.querySelectorAll<HTMLElement>(`[${REVEAL_ATTRIBUTE}]`)].filter(
    (element) => !isAuthoredHidden(element) && revealKindFor(element),
  );

  if (!targets.length || typeof IntersectionObserver !== "function") {
    return noop;
  }

  const preparedTargets: HTMLElement[] = [];
  const preparedKinds = new Map<HTMLElement, RevealKind>();
  const targetsByKind = new Map<RevealKind, HTMLElement[]>();

  for (const target of targets) {
    const kind = revealKindFor(target);

    if (!kind || isElementInViewport(target)) {
      continue;
    }

    preparedTargets.push(target);
    preparedKinds.set(target, kind);
    pushPreparedTarget(targetsByKind, kind, target);
  }

  if (!preparedTargets.length) {
    return noop;
  }

  for (const [kind, kindTargets] of targetsByKind) {
    gsap.set(kindTargets, REVEAL_PRESETS[kind].initial);
  }

  const observed = new Set(preparedTargets);
  const pending: Map<HTMLElement, Map<RevealKind, HTMLElement[]>> = new Map();
  const tweens = new Set<gsap.core.Tween>();
  let flushFrame = 0;

  const releaseTargets = (releaseTargetsList: readonly HTMLElement[]): void => {
    const releasable = releaseTargetsList.filter((target) => observed.has(target));

    if (!releasable.length) {
      return;
    }

    removePendingTargets(pending, releasable);

    for (const target of releasable) {
      observed.delete(target);
      observer.unobserve(target);
    }

    gsap.set(releasable, {
      clearProps: CLEAR_REVEAL_PROPS,
    });
  };

  const releaseRail = (rail: HTMLElement): void => {
    releaseTargets(preparedTargets.filter((target) => rail.contains(target)));
  };

  const flush = (): void => {
    flushFrame = 0;

    for (const [, groupTargets] of pending) {
      for (const [kind, elements] of groupTargets) {
        const batch: HTMLElement[] = [];

        for (const element of sortByDocumentOrder(elements)) {
          if (!observed.has(element)) {
            continue;
          }

          const rail = activeRevealRailFor(element);

          if (rail) {
            releaseRail(rail);
            continue;
          }

          observed.delete(element);
          observer.unobserve(element);
          batch.push(element);
        }

        if (!batch.length) {
          continue;
        }

        const tween = gsap.to(batch, {
          ...REVEAL_PRESETS[kind].final,
          clearProps: CLEAR_REVEAL_PROPS,
          onComplete() {
            tweens.delete(tween);
          },
        });

        tweens.add(tween);
      }
    }

    pending.clear();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        const target = entry.target;

        if (!(target instanceof HTMLElement) || !observed.has(target)) {
          continue;
        }

        const rail = activeRevealRailFor(target);

        if (rail) {
          releaseRail(rail);
          continue;
        }

        const kind = preparedKinds.get(target);

        if (!kind) {
          continue;
        }

        queueRevealTarget(pending, target, kind);
      }

      if (pending.size && !flushFrame) {
        flushFrame = requestAnimationFrame(flush);
      }
    },
    {
      root: null,
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.01,
    },
  );

  preparedTargets.forEach((target) => observer.observe(target));

  return () => {
    if (flushFrame) {
      cancelAnimationFrame(flushFrame);
      flushFrame = 0;
    }

    observer.disconnect();
    pending.clear();
    observed.clear();
    tweens.forEach((tween) => tween.kill());
    tweens.clear();

    gsap.set(preparedTargets, {
      clearProps: CLEAR_REVEAL_PROPS,
    });
  };
}

function createDeferredGlobalReveals(root: MotionRoot): () => void {
  let destroy: () => void = noop;
  let setupFrame = 0;

  const setup = (): void => {
    if (setupFrame || destroy !== noop) {
      return;
    }

    setupFrame = requestAnimationFrame(() => {
      setupFrame = 0;
      destroy = createGlobalReveals(root);
    });
  };

  if (document.readyState === "complete") {
    setup();
  } else {
    window.addEventListener("pageshow", setup, { once: true });
  }

  return () => {
    window.removeEventListener("pageshow", setup);

    if (setupFrame) {
      cancelAnimationFrame(setupFrame);
      setupFrame = 0;
    }

    destroy();
    destroy = noop;
  };
}

function createHeroTimeline(
  letter: Element,
  event: (typeof HERO_LETTER_EVENTS)[number],
): gsap.core.Timeline {
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

    return timeline;
  }

  if (event.type === "wobble") {
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

    return timeline;
  }

  if (event.type === "stretch") {
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

    return timeline;
  }

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

  return timeline;
}

function createHeroLetterMotion(root: MotionRoot): () => void {
  const states = new Map<
    HTMLElement,
    {
      context: gsap.Context;
      hero: HTMLElement;
      inViewport: boolean;
      timelines: gsap.core.Timeline[];
    }
  >();

  root.querySelectorAll<HTMLElement>("[data-hero-motion]").forEach((motionRoot) => {
    const letters = [...motionRoot.querySelectorAll<HTMLElement>("[data-hero-letter]")];

    if (!letters.length) {
      return;
    }

    const hero = motionRoot.closest<HTMLElement>(".hero") ?? motionRoot;
    const timelines: gsap.core.Timeline[] = [];
    const context = gsap.context(() => {
      gsap.set(letters, {
        transformOrigin: "50% 58%",
        transformPerspective: 900,
        force3D: true,
      });

      for (const event of HERO_LETTER_EVENTS) {
        const letter = letters[Math.abs(Math.trunc(event.index)) % letters.length];

        if (letter) {
          timelines.push(createHeroTimeline(letter, event));
        }
      }
    }, motionRoot);

    states.set(hero, {
      context,
      hero,
      inViewport:
        typeof IntersectionObserver === "function" ? isElementInViewport(hero) : true,
      timelines,
    });
  });

  if (!states.size) {
    return noop;
  }

  const syncState = (state: { inViewport: boolean; timelines: gsap.core.Timeline[] }): void => {
    const active = state.inViewport && !document.hidden;

    state.timelines.forEach((timeline) => {
      if (active) {
        timeline.resume();
      } else {
        timeline.pause();
      }
    });
  };

  const syncAll = (): void => {
    states.forEach(syncState);
  };

  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const target = entry.target;

              if (!(target instanceof HTMLElement)) {
                continue;
              }

              const state = states.get(target);

              if (!state) {
                continue;
              }

              state.inViewport = entry.isIntersecting;
              syncState(state);
            }
          },
          {
            root: null,
            threshold: 0,
          },
        )
      : null;

  states.forEach((state) => {
    observer?.observe(state.hero);
    syncState(state);
  });

  document.addEventListener("visibilitychange", syncAll);

  return () => {
    observer?.disconnect();
    document.removeEventListener("visibilitychange", syncAll);

    states.forEach((state) => {
      state.timelines.forEach((timeline) => timeline.kill());
      state.context.revert();
    });

    states.clear();
  };
}

export function initMotion({ root = document }: InitMotionOptions = {}): () => void {
  const matchMedia = gsap.matchMedia();

  matchMedia.add(REDUCED_MOTION_QUERY, () => {
    const destroys = [
      createHeroLetterMotion(root),
      createDeferredGlobalReveals(root),
    ];

    return () => {
      destroys
        .splice(0)
        .reverse()
        .forEach((destroy) => destroy?.());
    };
  });

  return () => {
    matchMedia.revert();
  };
}
