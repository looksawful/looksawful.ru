import { gsap } from "../vendor/gsap-globals.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DEFAULT_LETTER_SELECTOR = "[data-reveal-char], .hero-title-letter";

const PROFILE_CONFIG = {
  hero: {
    transformOrigin: "50% 58%",
    transformPerspective: 900,
    force3D: true,
    events: [
      { type: "jump", index: 4, delay: 2.4, repeatDelay: 9.5, y: -8, speed: 1 },
      { type: "jump", index: 18, delay: 6.8, repeatDelay: 11.2, y: -8, speed: 1 },
      { type: "flip", index: 6, delay: 4.8, repeatDelay: 12, speed: 1 },
      { type: "wobble", index: 13, delay: 8.2, repeatDelay: 10.5, rotation: 6, y: -3, speed: 1 },
      { type: "stretch", index: 22, delay: 12.4, repeatDelay: 13.5, scaleX: 1.16, scaleY: 0.92, speed: 1 }
    ]
  },
  display: {
    transformOrigin: "50% 58%",
    transformPerspective: 900,
    force3D: true,
    events: [
      { type: "jump", ratio: 0.18, delay: 0.45, repeatDelay: 7.5, y: -9, speed: 0.95 },
      { type: "flip", ratio: 0.38, delay: 1.8, repeatDelay: 12, speed: 1.05 },
      { type: "wobble", ratio: 0.62, delay: 3.4, repeatDelay: 10.5, rotation: 7, y: -3, speed: 1.1 },
      { type: "stretch", ratio: 0.82, delay: 5.2, repeatDelay: 14, scaleX: 1.13, scaleY: 0.91, speed: 1.08 }
    ]
  },
  heading: {
    transformOrigin: "50% 58%",
    transformPerspective: 900,
    force3D: true,
    events: [
      { type: "jump", ratio: 0.24, delay: 0.55, repeatDelay: 8.8, y: -7, speed: 1.05 },
      { type: "flip", ratio: 0.52, delay: 2.4, repeatDelay: 15, speed: 1.18 },
      { type: "wobble", ratio: 0.78, delay: 4.8, repeatDelay: 13, rotation: 5, y: -2, speed: 1.18 },
      { type: "stretch", ratio: 0.36, delay: 7.2, repeatDelay: 17, scaleX: 1.095, scaleY: 0.935, speed: 1.22 }
    ]
  },
  subheading: {
    transformOrigin: "50% 58%",
    transformPerspective: 900,
    force3D: true,
    events: [
      { type: "jump", ratio: 0.28, delay: 0.75, repeatDelay: 11, y: -5, speed: 1.22 },
      { type: "wobble", ratio: 0.66, delay: 3.7, repeatDelay: 17, rotation: 3.8, y: -1.5, speed: 1.32 },
      { type: "stretch", ratio: 0.46, delay: 6.6, repeatDelay: 21, scaleX: 1.06, scaleY: 0.96, speed: 1.35 }
    ]
  }
};

const motionStore = new WeakMap();

function shouldReduceMotion() {
  return typeof window === "undefined" || !window.matchMedia || window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function canAnimate() {
  return !shouldReduceMotion();
}

function normalizeProfile(profile) {
  if (typeof profile === "string") return PROFILE_CONFIG[profile] || PROFILE_CONFIG.heading;
  if (!profile || typeof profile !== "object") return PROFILE_CONFIG.heading;
  return { ...PROFILE_CONFIG.heading, ...profile };
}

function getLetters(target, options = {}) {
  if (Array.isArray(options.letters)) return options.letters.filter(Boolean);
  if (options.letters && typeof options.letters.length === "number") return [...options.letters].filter(Boolean);
  if (!target || typeof target.querySelectorAll !== "function") return [];
  return [...target.querySelectorAll(options.selector || DEFAULT_LETTER_SELECTOR)];
}

function getLetterByEvent(letters, event) {
  if (!letters.length) return null;
  if (Number.isFinite(event.index)) return letters[Math.abs(Math.trunc(event.index)) % letters.length];
  if (Number.isFinite(event.ratio)) {
    const index = Math.round((letters.length - 1) * Math.min(1, Math.max(0, event.ratio)));
    return letters[index];
  }
  return letters[0];
}

function createJump(gsap, letter, event) {
  const speed = event.speed || 1;
  return gsap.timeline().to(letter, { y: event.y ?? -6, duration: 0.2 * speed, ease: "power2.out" }).to(letter, { y: 0, duration: 0.42 * speed, ease: "power2.inOut" }, "+=0.28");
}

function createFlip(gsap, letter, event) {
  const speed = event.speed || 1;
  return gsap.timeline().to(letter, { rotationX: 180, duration: 0.4 * speed, ease: "power2.inOut" }).to(letter, { rotationX: 360, duration: 0.46 * speed, ease: "power2.inOut" }, "+=0.12").set(letter, { rotationX: 0 });
}

function createWobble(gsap, letter, event) {
  const speed = event.speed || 1;
  const rotation = event.rotation ?? 5;
  const y = event.y ?? -2;
  return gsap.timeline().to(letter, { rotation: -rotation, y, duration: 0.23 * speed, ease: "power1.out" }).to(letter, { rotation: rotation * 0.84, y: 1, duration: 0.28 * speed, ease: "power1.inOut" }).to(letter, { rotation: -rotation * 0.34, y: 0, duration: 0.24 * speed, ease: "power1.inOut" }).to(letter, { rotation: 0, y: 0, duration: 0.36 * speed, ease: "power2.out" });
}

function createStretch(gsap, letter, event) {
  const speed = event.speed || 1;
  return gsap.timeline().to(letter, { scaleX: event.scaleX ?? 1.08, scaleY: event.scaleY ?? 0.95, duration: 0.28 * speed, ease: "power2.out" }).to(letter, { scaleX: 1, scaleY: 1, duration: 0.44 * speed, ease: "power2.inOut" }, "+=0.06");
}

function createEventTimeline(gsap, letter, event) {
  if (!letter) return null;
  const timeline = gsap.timeline({ repeat: -1, repeatDelay: event.repeatDelay ?? 12, delay: event.delay ?? 0, paused: true });
  if (event.type === "flip") timeline.add(createFlip(gsap, letter, event), 0);
  else if (event.type === "wobble") timeline.add(createWobble(gsap, letter, event), 0);
  else if (event.type === "stretch") timeline.add(createStretch(gsap, letter, event), 0);
  else timeline.add(createJump(gsap, letter, event), 0);
  return timeline;
}

function bindViewportPlayback(target, timelines) {
  if (!target || !("IntersectionObserver" in window)) {
    timelines.forEach((timeline) => timeline.play());
    return null;
  }
  const observer = new IntersectionObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    timelines.forEach((timeline) => {
      if (entry.isIntersecting) timeline.play();
      else timeline.pause();
    });
  }, { threshold: 0, rootMargin: "18% 0px 18% 0px" });
  observer.observe(target);
  return () => observer.disconnect();
}

export function splitTextIntoGraphemes(text) {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    const segmenter = new Intl.Segmenter("ru", { granularity: "grapheme" });
    return [...segmenter.segment(text)].map((segment) => segment.segment);
  }
  return [...text];
}

export function killLetterIdleMotion(target) {
  const record = motionStore.get(target);
  if (!record) return;
  record.timelines.forEach((timeline) => timeline.kill());
  record.disconnect?.();
  motionStore.delete(target);
}

export function createLetterIdleMotion(target, options = {}) {
  if (!target || motionStore.has(target) || !canAnimate()) return null;
  const letters = getLetters(target, options);
  const profile = normalizeProfile(options.profile);
  const events = Array.isArray(profile.events) ? profile.events : [];
  if (!letters.length || !events.length) return null;
  gsap.set(letters, { transformOrigin: profile.transformOrigin || "50% 58%", transformPerspective: profile.transformPerspective || 900, force3D: profile.force3D !== false });
  const timelines = events.map((event) => createEventTimeline(gsap, getLetterByEvent(letters, event), event)).filter(Boolean);
  if (!timelines.length) return null;
  const disconnect = options.pauseWhenHidden === false ? null : bindViewportPlayback(target, timelines);
  if (options.pauseWhenHidden === false) timelines.forEach((timeline) => timeline.play());
  const record = { timelines, disconnect };
  motionStore.set(target, record);
  return record;
}

