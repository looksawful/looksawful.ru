import { gsap } from "gsap";

import type { createMotionPreference } from "./motion-preference.ts";
import "./client-logo-motion.css";

type MotionPreference = ReturnType<typeof createMotionPreference>;
type Destroy = () => void;

type ClientLogoMotionOptions = {
  root?: ParentNode;
  motion?: MotionPreference;
};

type LogoWallMotionOptions = {
  motion?: MotionPreference;
};

const noop: Destroy = () => {};
const WALL_SELECTOR = ".portfolio-logo-wall";
const TRACK_SELECTOR = "[data-infinite-reel-track]";
const ITEM_SELECTOR = ".portfolio-logo-wall__item";
const SURFACE_SELECTOR = ".media__surface";
const CLONE_ATTRIBUTE = "data-infinite-reel-clone";
const ACTIVE_ATTRIBUTE = "data-client-logo-motion-active";
const POINTER_QUERY = "(hover: hover) and (pointer: fine)";

const driftY = [-1.35, 0.95, -0.8, 1.2, -0.65, 1.05] as const;
const driftRotation = [-0.24, 0.18, -0.16, 0.27, -0.12, 0.2] as const;
const driftDuration = [3.8, 4.4, 4.05, 4.75, 3.65, 4.25] as const;

function getItems(track: HTMLElement): HTMLElement[] {
  return [...track.querySelectorAll<HTMLElement>(ITEM_SELECTOR)];
}

function getAuthoredItems(track: HTMLElement): HTMLElement[] {
  return getItems(track).filter((item) => !item.hasAttribute(CLONE_ATTRIBUTE));
}

function getSurface(item: HTMLElement): HTMLElement | null {
  return item.querySelector<HTMLElement>(SURFACE_SELECTOR);
}

function getImage(item: HTMLElement): HTMLImageElement | null {
  return item.querySelector<HTMLImageElement>(`${SURFACE_SELECTOR} > img`);
}

function createLogoWallMotion(
  root: Element | null | undefined,
  { motion }: LogoWallMotionOptions = {},
): Destroy {
  if (!(root instanceof HTMLElement)) return noop;

  const track = root.querySelector<HTMLElement>(TRACK_SELECTOR);
  if (!track) return noop;

  let destroyed = false;
  let allowed = motion?.allowsMotion() ?? true;
  let inViewport = typeof IntersectionObserver !== "function";
  let entrancePlayed = false;
  let entranceTween: gsap.core.Tween | null = null;
  let activeSurface: HTMLElement | null = null;

  const ambientTweens = new Map<HTMLImageElement, gsap.core.Tween>();

  const isActive = (): boolean => allowed && inViewport && !document.hidden && !destroyed;

  const resetSurface = (surface: HTMLElement | null, immediate = false): void => {
    if (!surface) return;

    if (immediate) {
      gsap.killTweensOf(surface);
      gsap.set(surface, { clearProps: "x,y,rotationX,rotationY,scale" });
      return;
    }

    gsap.to(surface, {
      x: 0,
      y: 0,
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      duration: 0.42,
      ease: "power3.out",
      overwrite: "auto",
      onComplete() {
        gsap.set(surface, { clearProps: "x,y,rotationX,rotationY,scale" });
      },
    });
  };

  const registerAmbientItem = (item: HTMLElement, index: number): void => {
    const image = getImage(item);
    if (!image || ambientTweens.has(image)) return;

    const slot = index % driftY.length;
    const tween = gsap.to(image, {
      yPercent: driftY[slot],
      rotation: driftRotation[slot],
      scale: 1.012 + (slot % 3) * 0.003,
      duration: driftDuration[slot],
      delay: (slot * 0.13) % 0.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      paused: true,
    });

    ambientTweens.set(image, tween);
  };

  const registerAllAmbientItems = (): void => {
    getItems(track).forEach(registerAmbientItem);
  };

  const syncAmbientPlayback = (): void => {
    const active = isActive();
    root.toggleAttribute(ACTIVE_ATTRIBUTE, active);

    ambientTweens.forEach((tween) => {
      if (active) tween.resume();
      else tween.pause();
    });
  };

  const clearAuthoredSurfaceState = (): void => {
    const surfaces = getAuthoredItems(track)
      .map(getSurface)
      .filter((surface): surface is HTMLElement => surface instanceof HTMLElement);

    if (!surfaces.length) return;

    gsap.set(surfaces, {
      clearProps: "opacity,visibility,transform,filter",
    });
  };

  const playEntrance = (): void => {
    if (entrancePlayed || !isActive()) return;

    const surfaces = getAuthoredItems(track)
      .map(getSurface)
      .filter((surface): surface is HTMLElement => surface instanceof HTMLElement);

    if (!surfaces.length) return;

    entrancePlayed = true;
    entranceTween?.kill();

    entranceTween = gsap.fromTo(
      surfaces,
      {
        autoAlpha: 0.46,
        yPercent: (index) => (index % 2 === 0 ? 7 : -6),
        scale: 0.97,
        rotationX: (index) => (index % 2 === 0 ? -4 : 4),
        rotationY: (index) => ((index % 3) - 1) * 2,
        filter: "blur(3px)",
        transformPerspective: 900,
        transformOrigin: "50% 50%",
      },
      {
        autoAlpha: 1,
        yPercent: 0,
        scale: 1,
        rotationX: 0,
        rotationY: 0,
        filter: "blur(0px)",
        duration: 0.64,
        stagger: {
          each: 0.028,
          from: "start",
        },
        ease: "power3.out",
        clearProps: "opacity,visibility,transform,filter",
        onComplete() {
          entranceTween = null;
        },
      },
    );
  };

  const sync = (): void => {
    registerAllAmbientItems();

    if (!allowed) {
      entranceTween?.kill();
      entranceTween = null;
      clearAuthoredSurfaceState();
      resetSurface(activeSurface, true);
      activeSurface = null;
    }

    syncAmbientPlayback();
    playEntrance();
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (!isActive() || !window.matchMedia?.(POINTER_QUERY).matches) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const item = target.closest(ITEM_SELECTOR);
    if (!(item instanceof HTMLElement) || !root.contains(item)) {
      resetSurface(activeSurface);
      activeSurface = null;
      return;
    }

    const surface = getSurface(item);
    if (!surface) return;

    if (surface !== activeSurface) {
      resetSurface(activeSurface);
      activeSurface = surface;
    }

    const rect = surface.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const normalizedX = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5));
    const normalizedY = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5));

    gsap.to(surface, {
      x: normalizedX * 10,
      y: normalizedY * 7,
      rotationY: normalizedX * 7,
      rotationX: normalizedY * -5,
      scale: 1.038,
      duration: 0.28,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const handlePointerLeave = (): void => {
    resetSurface(activeSurface);
    activeSurface = null;
  };

  const handleVisibilityChange = (): void => syncAmbientPlayback();

  const mutationObserver = typeof MutationObserver === "function"
    ? new MutationObserver(() => {
        registerAllAmbientItems();
        syncAmbientPlayback();
      })
    : null;

  mutationObserver?.observe(track, { childList: true });

  const intersectionObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(
        ([entry]) => {
          inViewport = Boolean(entry?.isIntersecting);
          sync();
        },
        {
          root: null,
          rootMargin: "12% 0px",
          threshold: 0.08,
        },
      )
    : null;

  intersectionObserver?.observe(root);

  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerleave", handlePointerLeave);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const unsubscribe = motion?.subscribe(({ allowed: nextAllowed }) => {
    allowed = Boolean(nextAllowed);
    sync();
  }) ?? noop;

  registerAllAmbientItems();
  sync();

  return () => {
    destroyed = true;
    entranceTween?.kill();
    entranceTween = null;
    intersectionObserver?.disconnect();
    mutationObserver?.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    root.removeEventListener("pointermove", handlePointerMove);
    root.removeEventListener("pointerleave", handlePointerLeave);
    unsubscribe();

    resetSurface(activeSurface, true);
    activeSurface = null;

    ambientTweens.forEach((tween, image) => {
      tween.kill();
      gsap.set(image, { clearProps: "transform" });
    });
    ambientTweens.clear();

    clearAuthoredSurfaceState();
    root.removeAttribute(ACTIVE_ATTRIBUTE);
  };
}

export function createClientLogoMotion({
  root = document,
  motion,
}: ClientLogoMotionOptions = {}): Destroy {
  const destroys = [...root.querySelectorAll(WALL_SELECTOR)].map((element) =>
    createLogoWallMotion(element, { motion }),
  );

  return () => destroys.splice(0).reverse().forEach((destroy) => destroy());
}
