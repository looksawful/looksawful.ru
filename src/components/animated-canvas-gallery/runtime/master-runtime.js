/*
  Shared declarative runtime for all MovesAwful master components.

  Copy this file once together with any selected animation folders.
  Animation engines remain independent; this file only maps data attributes
  to their existing controller APIs and keeps reduced-motion/runtime state.
*/
export const DURATION_FACTORS = Object.freeze({
  static: 0,
  sluggish: 1.8,
  slow: 1.4,
  medium: 1.15,
  moderate: 1,
  fast: 0.8,
  rapid: 0.6,
  ultra: 0.42,
});

export const DURATION_OPTIONS = Object.freeze(Object.keys(DURATION_FACTORS));

export const SCROLL_MODE_OPTIONS = Object.freeze([
  "scroll-driven",
  "autoplay",
  "scroll-slowdown",
  "sequential-focus",
  "center-slowdown",
]);

const field = ({
  name,
  attr,
  defaultValue,
  parse = "string",
  group,
  label,
  control = "text",
  options,
  min,
  max,
  step,
  visibleWhen,
  presetPart = false,
}) => ({
  name,
  attr,
  defaultValue,
  parse,
  group,
  label,
  control,
  options,
  min,
  max,
  step,
  visibleWhen,
  presetPart,
});

export function createSharedFields({ presetOptions, defaultPreset = "autoplay", cycleMs = 12000 }) {
  return [
    field({
      name: "animationPreset",
      attr: "data-animation-preset",
      defaultValue: defaultPreset,
      group: "state",
      label: "preset",
      control: "select",
      options: [...presetOptions, "custom"],
    }),
    field({
      name: "animationDuration",
      attr: "data-animation-duration",
      defaultValue: "moderate",
      group: "state",
      label: "duration",
      control: "select",
      options: DURATION_OPTIONS,
    }),
    field({
      name: "animationIsLooping",
      attr: "data-animation-is-looping",
      defaultValue: true,
      parse: "boolean",
      group: "state",
      label: "loop",
      control: "checkbox",
    }),
    field({
      name: "animationCycleMs",
      attr: "data-animation-cycle-ms",
      defaultValue: cycleMs,
      parse: "number",
      group: "state",
      label: "single cycle, ms",
      control: "number",
      min: 250,
      max: 120000,
      step: 250,
      visibleWhen: { animationIsLooping: false },
    }),
    field({
      name: "autoplay",
      attr: "data-autoplay",
      defaultValue: true,
      parse: "boolean",
      group: "state",
      label: "autoplay",
      control: "checkbox",
    }),
    field({
      name: "animationMode",
      attr: "data-animation-mode",
      defaultValue: "autoplay",
      group: "interaction",
      label: "mode",
      control: "select",
      options: SCROLL_MODE_OPTIONS,
      presetPart: true,
    }),
    field({
      name: "animationHover",
      attr: "data-animation-hover",
      defaultValue: true,
      parse: "boolean",
      group: "interaction",
      label: "hover pause + scale",
      control: "checkbox",
    }),
    field({
      name: "animationLightbox",
      attr: "data-animation-lightbox",
      defaultValue: true,
      parse: "boolean",
      group: "interaction",
      label: "lightbox",
      control: "checkbox",
    }),
    field({
      name: "animationHoverMaxScale",
      attr: "data-animation-hover-max-scale",
      defaultValue: 1.06,
      parse: "number",
      group: "interaction",
      label: "hover max scale",
      control: "range",
      min: 1,
      max: 1.3,
      step: 0.005,
    }),
    field({
      name: "animationHoverEase",
      attr: "data-animation-hover-ease",
      defaultValue: 0.18,
      parse: "number",
      group: "interaction",
      label: "hover ease",
      control: "range",
      min: 0.01,
      max: 1,
      step: 0.01,
    }),
    field({
      name: "animationScrollSensitivity",
      attr: "data-animation-scroll-sensitivity",
      defaultValue: 4,
      parse: "number",
      group: "scroll",
      label: "scroll sensitivity",
      control: "range",
      min: 0.1,
      max: 20,
      step: 0.1,
      visibleWhen: { animationMode: "scroll-driven" },
    }),
    field({
      name: "animationScrollIdleMs",
      attr: "data-animation-scroll-idle-ms",
      defaultValue: 140,
      parse: "number",
      group: "scroll",
      label: "scroll idle, ms",
      control: "number",
      min: 0,
      max: 2000,
      step: 10,
      visibleWhen: { animationMode: "scroll-slowdown" },
    }),
    field({
      name: "animationScrollSlowFactor",
      attr: "data-animation-scroll-slow-factor",
      defaultValue: 0.22,
      parse: "number",
      group: "scroll",
      label: "scroll slowdown factor",
      control: "range",
      min: 0,
      max: 2,
      step: 0.01,
      visibleWhen: { animationMode: "scroll-slowdown" },
    }),
    field({
      name: "animationCenterMinFactor",
      attr: "data-animation-center-min-factor",
      defaultValue: 0.2,
      parse: "number",
      group: "scroll",
      label: "center min factor",
      control: "range",
      min: 0,
      max: 1,
      step: 0.01,
      visibleWhen: { animationMode: "center-slowdown" },
    }),
    field({
      name: "animationSequentialRole",
      attr: "data-animation-sequential-role",
      defaultValue: "active-slow",
      group: "sequential",
      label: "active lane",
      control: "select",
      options: ["active-slow", "active-fast"],
      visibleWhen: { animationMode: "sequential-focus" },
      presetPart: true,
    }),
    field({
      name: "animationSequentialOrder",
      attr: "data-animation-sequential-order",
      defaultValue: "forward",
      group: "sequential",
      label: "lane order",
      control: "select",
      options: ["forward", "reverse"],
      visibleWhen: { animationMode: "sequential-focus" },
      presetPart: true,
    }),
    field({
      name: "animationSequentialFocusedFactor",
      attr: "data-animation-sequential-focused-factor",
      defaultValue: 0.22,
      parse: "number",
      group: "sequential",
      label: "focused factor",
      control: "range",
      min: 0,
      max: 3,
      step: 0.01,
      visibleWhen: { animationMode: "sequential-focus" },
    }),
    field({
      name: "animationSequentialBackgroundFactor",
      attr: "data-animation-sequential-background-factor",
      defaultValue: 1.18,
      parse: "number",
      group: "sequential",
      label: "background factor",
      control: "range",
      min: 0,
      max: 3,
      step: 0.01,
      visibleWhen: { animationMode: "sequential-focus" },
    }),
    field({
      name: "animationSequentialFastFactor",
      attr: "data-animation-sequential-fast-factor",
      defaultValue: 1.8,
      parse: "number",
      group: "sequential",
      label: "fast factor",
      control: "range",
      min: 0,
      max: 4,
      step: 0.01,
      visibleWhen: { animationMode: "sequential-focus" },
    }),
    field({
      name: "animationSequentialSlowFactor",
      attr: "data-animation-sequential-slow-factor",
      defaultValue: 0.55,
      parse: "number",
      group: "sequential",
      label: "slow factor",
      control: "range",
      min: 0,
      max: 3,
      step: 0.01,
      visibleWhen: { animationMode: "sequential-focus" },
    }),
    field({
      name: "animationSpeedEase",
      attr: "data-animation-speed-ease",
      defaultValue: 0.12,
      parse: "number",
      group: "interaction",
      label: "speed ease",
      control: "range",
      min: 0.01,
      max: 1,
      step: 0.01,
    }),
    field({
      name: "animationMaxDpr",
      attr: "data-animation-max-dpr",
      defaultValue: 2,
      parse: "number",
      group: "performance",
      label: "max dpr",
      control: "range",
      min: 1,
      max: 3,
      step: 0.1,
    }),
    field({
      name: "animationPauseOnReducedMotion",
      attr: "data-animation-pause-on-reduced-motion",
      defaultValue: true,
      parse: "boolean",
      group: "performance",
      label: "pause on reduced motion",
      control: "checkbox",
    }),
  ];
}

export function makeField(config) {
  return field(config);
}

export function durationFactor(duration) {
  return DURATION_FACTORS[duration] ?? DURATION_FACTORS.moderate;
}

export function scaledSpeed(speed, duration) {
  const factor = durationFactor(duration);
  if (factor <= 0) return 0;
  return Number(speed) / factor;
}

export function scaledNumberList(values, duration) {
  if (!Array.isArray(values)) return null;
  const factor = durationFactor(duration);
  if (factor <= 0) return values.map(() => 0);
  return values.map((value) => Number(value) / factor);
}

export function buildInteraction(values) {
  return {
    hover: values.animationHover,
    lightbox: values.animationLightbox,
    hoverMaxScale: values.animationHoverMaxScale,
    hoverEase: values.animationHoverEase,
    scrollMode: values.animationMode,
    scrollSensitivity: values.animationScrollSensitivity,
    scrollIdleMs: values.animationScrollIdleMs,
    scrollSlowFactor: values.animationScrollSlowFactor,
    centerMinFactor: values.animationCenterMinFactor,
    sequentialRole: values.animationSequentialRole,
    sequentialOrder: values.animationSequentialOrder,
    sequentialFocusedFactor: values.animationSequentialFocusedFactor,
    sequentialBackgroundFactor: values.animationSequentialBackgroundFactor,
    sequentialFastFactor: values.animationSequentialFastFactor,
    sequentialSlowFactor: values.animationSequentialSlowFactor,
    speedEase: values.animationSpeedEase,
  };
}

export const COMMON_PRESETS = Object.freeze({
  "scroll-driven": {
    "data-animation-mode": "scroll-driven",
    "data-animation-sequential-role": "active-slow",
    "data-animation-sequential-order": "forward",
  },
  autoplay: {
    "data-animation-mode": "autoplay",
    "data-animation-sequential-role": "active-slow",
    "data-animation-sequential-order": "forward",
  },
  "scroll-slowdown": {
    "data-animation-mode": "scroll-slowdown",
    "data-animation-sequential-role": "active-slow",
    "data-animation-sequential-order": "forward",
  },
  "center-slowdown": {
    "data-animation-mode": "center-slowdown",
    "data-animation-sequential-role": "active-slow",
    "data-animation-sequential-order": "forward",
  },
});

export const ROW_PRESETS = Object.freeze({
  ...COMMON_PRESETS,
  "rows-active-slow": {
    "data-animation-mode": "sequential-focus",
    "data-animation-sequential-role": "active-slow",
    "data-animation-sequential-order": "forward",
  },
  "rows-active-fast": {
    "data-animation-mode": "sequential-focus",
    "data-animation-sequential-role": "active-fast",
    "data-animation-sequential-order": "forward",
  },
});

export const MASONRY_PRESETS = Object.freeze({
  ...COMMON_PRESETS,
  "columns-ltr-active-slow": {
    "data-animation-mode": "sequential-focus",
    "data-animation-sequential-role": "active-slow",
    "data-animation-sequential-order": "forward",
  },
  "columns-ltr-active-fast": {
    "data-animation-mode": "sequential-focus",
    "data-animation-sequential-role": "active-fast",
    "data-animation-sequential-order": "forward",
  },
  "columns-rtl-active-slow": {
    "data-animation-mode": "sequential-focus",
    "data-animation-sequential-role": "active-slow",
    "data-animation-sequential-order": "reverse",
  },
  "columns-rtl-active-fast": {
    "data-animation-mode": "sequential-focus",
    "data-animation-sequential-role": "active-fast",
    "data-animation-sequential-order": "reverse",
  },
});

const activeComponents = new WeakMap();

const PARSERS = Object.freeze({
  string: (value) => value,
  boolean: (value) => value === "true" || value === "",
  number: (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  },
  integer: (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  },
  nullableNumber: (value) => {
    if (value == null || value.trim() === "" || value === "null" || value === "auto") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  },
  numberList: (value) => {
    if (value == null || value.trim() === "") return null;
    const list = value.split(",").map((part) => Number(part.trim())).filter(Number.isFinite);
    return list.length ? list : null;
  },
  integerList: (value) => {
    if (value == null || value.trim() === "") return [];
    return value.split(",").map((part) => Number.parseInt(part.trim(), 10)).filter(Number.isFinite);
  },
  stringList: (value) => {
    if (value == null || value.trim() === "") return null;
    const list = value.split(",").map((part) => part.trim()).filter(Boolean);
    return list.length ? list : null;
  },
  autoInteger: (value) => {
    if (value == null || value.trim() === "" || value === "auto") return "auto";
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : "auto";
  },
});

function resolveElement(target) {
  if (target instanceof HTMLElement) return target;
  if (typeof target !== "string") return null;
  return document.querySelector(target);
}

function serialize(value) {
  if (Array.isArray(value)) return value.join(",");
  if (value == null) return "";
  return String(value);
}

function ensureDefaults(root, fields) {
  for (const field of fields) {
    if (!root.hasAttribute(field.attr)) {
      root.setAttribute(field.attr, serialize(field.defaultValue));
    }
  }
}

function readValues(root, fields) {
  return Object.fromEntries(fields.map((field) => {
    const raw = root.getAttribute(field.attr) ?? serialize(field.defaultValue);
    const parser = PARSERS[field.parse || "string"] || PARSERS.string;
    return [field.name, parser(raw)];
  }));
}

function applyPreset(root, presetName, presets) {
  const preset = presets[presetName];
  if (!preset) return;
  for (const [attribute, value] of Object.entries(preset)) {
    root.setAttribute(attribute, serialize(value));
  }
}

function emitState(root, detail) {
  root.dispatchEvent(new CustomEvent("animated-canvas-gallery:statechange", {
    bubbles: true,
    detail,
  }));
}

export async function mountDataComponent(target, {
  mount,
  items,
  fields,
  presets,
  buildOptions,
  canvasSelector = "[data-moves-canvas]",
}) {
  const root = resolveElement(target);
  if (!root) throw new Error("mountDataComponent: component root not found.");

  const canvas = root.querySelector(canvasSelector);
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("mountDataComponent: canvas not found inside component root.");
  }

  activeComponents.get(root)?.dispose?.();
  ensureDefaults(root, fields);

  const presetField = fields.find((field) => field.name === "animationPreset");
  const presetAttribute = presetField?.attr || "data-animation-preset";
  const initialPreset = root.getAttribute(presetAttribute);
  if (initialPreset && initialPreset !== "custom") applyPreset(root, initialPreset, presets);

  const motionPreference = matchMedia("(prefers-reduced-motion: no-preference)");
  let controller = null;
  let disposed = false;
  let frameId = 0;
  let finiteTimer = 0;
  let applyRevision = 0;
  let currentValues = readValues(root, fields);
  let externallySuspended = root.dataset.previewActive === "false";

  const clearFiniteTimer = () => {
    if (finiteTimer) clearTimeout(finiteTimer);
    finiteTimer = 0;
  };

  const setRuntimeState = ({ playing, state }) => {
    root.dataset.isMounted = String(Boolean(controller));
    root.dataset.playing = String(Boolean(playing));
    root.dataset.motionState = state;
    emitState(root, {
      playing: Boolean(playing),
      state,
      values: { ...currentValues },
    });
  };

  const applyConfiguration = async () => {
    if (disposed) return;
    const revision = ++applyRevision;
    clearFiniteTimer();
    currentValues = readValues(root, fields);

    const animated = motionPreference.matches;
    root.dataset.isAnimated = String(animated);
    root.dataset.animationDurationFactor = String(durationFactor(currentValues.animationDuration));

    const shouldPlay = Boolean(
      animated &&
      currentValues.autoplay &&
      currentValues.animationDuration !== "static" &&
      !externallySuspended
    );

    const options = buildOptions(currentValues, root);
    options.paused = !shouldPlay;

    try {
      if (!controller) {
        setRuntimeState({ playing: false, state: "loading" });
        controller = await mount(canvas, { items, ...options });
      } else {
        await controller.update(options);
      }

      if (disposed || revision !== applyRevision) return;

      if (shouldPlay) controller.play();
      else controller.pause();

      setRuntimeState({
        playing: shouldPlay,
        state: externallySuspended ? "inactive" : "ready",
      });

      if (
        shouldPlay &&
        currentValues.animationIsLooping === false &&
        currentValues.animationMode !== "scroll-driven"
      ) {
        const cycleMs = Math.max(250, Number(currentValues.animationCycleMs) || 12000);
        const factor = Math.max(0.01, durationFactor(currentValues.animationDuration));
        finiteTimer = window.setTimeout(() => {
          if (disposed || !controller) return;
          controller.pause();
          setRuntimeState({ playing: false, state: "completed" });
        }, cycleMs * factor);
      }
    } catch (error) {
      if (disposed || revision !== applyRevision) return;
      root.dataset.motionState = "error";
      root.dataset.playing = "false";
      console.error(error);
    }
  };

  const scheduleApply = () => {
    if (disposed) return;
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      void applyConfiguration();
    });
  };

  const observer = new MutationObserver((records) => {
    const presetChanged = records.some((record) => record.attributeName === presetAttribute);
    if (presetChanged) {
      const preset = root.getAttribute(presetAttribute);
      if (preset && preset !== "custom") applyPreset(root, preset, presets);
    }
    scheduleApply();
  });

  observer.observe(root, {
    attributes: true,
    attributeFilter: fields.map((field) => field.attr),
  });

  const syncMotionPreference = () => {
    root.dataset.isAnimated = String(motionPreference.matches);
    scheduleApply();
  };

  const onPointerEnter = () => {
    root.dataset.isHovered = "true";
  };

  const onPointerLeave = () => {
    root.dataset.isHovered = "false";
  };

  const onLightboxChange = (event) => {
    root.dataset.isLightboxOpen = String(Boolean(event.detail?.open));
  };

  const visibilityObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((entries) => {
        const entry = entries[0];
        root.dataset.isVisible = String(Boolean(entry?.isIntersecting));
      })
    : null;

  motionPreference.addEventListener?.("change", syncMotionPreference);
  canvas.addEventListener("pointerenter", onPointerEnter, { passive: true });
  canvas.addEventListener("pointerleave", onPointerLeave, { passive: true });
  canvas.addEventListener("animated-canvas-gallery:lightboxchange", onLightboxChange);
  visibilityObserver?.observe(root);
  root.dataset.isHovered = "false";
  root.dataset.isLightboxOpen = "false";
  root.dataset.isVisible = visibilityObserver ? "false" : "true";
  syncMotionPreference();

  const component = {
    get root() { return root; },
    get canvas() { return canvas; },
    get controller() { return controller; },
    get values() { return { ...currentValues }; },
    refresh: scheduleApply,
    setAttributes(patch = {}) {
      for (const [attribute, value] of Object.entries(patch)) {
        root.setAttribute(attribute, serialize(value));
      }
      return component;
    },
    suspend() {
      if (disposed || externallySuspended) return component;
      externallySuspended = true;
      root.dataset.previewActive = "false";
      scheduleApply();
      return component;
    },
    resume() {
      if (disposed || !externallySuspended) return component;
      externallySuspended = false;
      root.dataset.previewActive = "true";
      scheduleApply();
      return component;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      applyRevision += 1;
      cancelAnimationFrame(frameId);
      clearFiniteTimer();
      observer.disconnect();
      motionPreference.removeEventListener?.("change", syncMotionPreference);
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("animated-canvas-gallery:lightboxchange", onLightboxChange);
      visibilityObserver?.disconnect();
      controller?.dispose?.();
      controller = null;
      root.dataset.isMounted = "false";
      root.dataset.playing = "false";
      root.dataset.motionState = "disposed";
      if (activeComponents.get(root) === component) activeComponents.delete(root);
    },
  };

  activeComponents.set(root, component);
  await applyConfiguration();
  return component;
}

const ROW_PRESET_ORDER = [
  "scroll-driven",
  "autoplay",
  "scroll-slowdown",
  "rows-active-slow",
  "rows-active-fast",
  "center-slowdown",
];

export function createRowComponentDefinition({
  name,
  mount,
  defaults,
  cycleMs = 12000,
}) {
  const fields = [
    ...createSharedFields({
      presetOptions: ROW_PRESET_ORDER,
      defaultPreset: "autoplay",
      cycleMs,
    }),
    makeField({
      name: "animationDirection",
      attr: "data-animation-direction",
      defaultValue: "auto",
      group: "motion",
      label: "direction",
      control: "select",
      options: ["auto", "left", "right"],
    }),
    makeField({
      name: "animationRows",
      attr: "data-animation-rows",
      defaultValue: defaults.rows,
      parse: "integer",
      group: "geometry",
      label: "rows",
      control: "range",
      min: 1,
      max: 12,
      step: 1,
    }),
    makeField({
      name: "animationGap",
      attr: "data-animation-gap",
      defaultValue: defaults.gap,
      parse: "number",
      group: "geometry",
      label: "gap",
      control: "range",
      min: 0,
      max: 64,
      step: 1,
    }),
    makeField({
      name: "animationSpeed",
      attr: "data-animation-speed",
      defaultValue: defaults.speed,
      parse: "number",
      group: "motion",
      label: "base speed",
      control: "number",
      min: 0,
      max: 2,
      step: 0.001,
    }),
    makeField({
      name: "animationRowSpeeds",
      attr: "data-animation-row-speeds",
      defaultValue: "",
      parse: "numberList",
      group: "motion",
      label: "row speeds, comma separated",
      control: "text",
    }),
    makeField({
      name: "animationDirections",
      attr: "data-animation-directions",
      defaultValue: "",
      parse: "numberList",
      group: "motion",
      label: "row directions: -1, 1",
      control: "text",
    }),
    makeField({
      name: "animationRowOffsets",
      attr: "data-animation-row-offsets",
      defaultValue: "",
      parse: "numberList",
      group: "motion",
      label: "row offsets",
      control: "text",
    }),
    makeField({
      name: "animationAngle",
      attr: "data-animation-angle",
      defaultValue: Number((defaults.angle * 180 / Math.PI).toFixed(4)),
      parse: "number",
      group: "geometry",
      label: "angle, degrees",
      control: "range",
      min: -45,
      max: 45,
      step: 0.5,
    }),
    makeField({
      name: "animationRadius",
      attr: "data-animation-radius",
      defaultValue: defaults.radius,
      parse: "number",
      group: "geometry",
      label: "card radius",
      control: "range",
      min: 0,
      max: 64,
      step: 1,
    }),
    makeField({
      name: "animationMinRatio",
      attr: "data-animation-min-ratio",
      defaultValue: defaults.minRatio,
      parse: "number",
      group: "geometry",
      label: "min ratio",
      control: "range",
      min: 0.2,
      max: 2,
      step: 0.01,
    }),
    makeField({
      name: "animationMaxRatio",
      attr: "data-animation-max-ratio",
      defaultValue: defaults.maxRatio,
      parse: "number",
      group: "geometry",
      label: "max ratio",
      control: "range",
      min: 0.5,
      max: 5,
      step: 0.01,
    }),
    makeField({
      name: "animationOverscan",
      attr: "data-animation-overscan",
      defaultValue: defaults.overscan,
      parse: "number",
      group: "geometry",
      label: "overscan",
      control: "range",
      min: 0,
      max: 500,
      step: 5,
    }),
  ];

  const buildOptions = (values) => {
    const rowCount = Math.max(1, Math.floor(values.animationRows));
    let directions = values.animationDirections;
    if (!directions && values.animationDirection !== "auto") {
      directions = Array.from(
        { length: rowCount },
        () => values.animationDirection === "left" ? -1 : 1,
      );
    }

    return {
      rows: rowCount,
      gap: Math.max(0, values.animationGap),
      speed: scaledSpeed(Math.abs(values.animationSpeed), values.animationDuration),
      rowSpeeds: scaledNumberList(values.animationRowSpeeds, values.animationDuration),
      directions,
      rowOffsets: values.animationRowOffsets,
      angle: values.animationAngle * Math.PI / 180,
      radius: Math.max(0, values.animationRadius),
      minRatio: Math.max(0.01, values.animationMinRatio),
      maxRatio: Math.max(values.animationMinRatio, values.animationMaxRatio),
      overscan: Math.max(0, values.animationOverscan),
      maxDpr: Math.max(1, values.animationMaxDpr),
      pauseOnReducedMotion: values.animationPauseOnReducedMotion,
      interaction: buildInteraction(values),
    };
  };

  const mountComponent = (target, { items } = {}) => mountDataComponent(target, {
    mount,
    items,
    fields,
    presets: ROW_PRESETS,
    buildOptions,
  });

  return Object.freeze({
    name,
    fields,
    presets: ROW_PRESETS,
    buildOptions,
    mountComponent,
  });
}
