import { mountSpiral, SPIRAL_DEFAULTS } from "./index.js";
import {
  mountDataComponent,
  COMMON_PRESETS,
  buildInteraction,
  createSharedFields,
  makeField,
  scaledSpeed,
} from "../../runtime/master-runtime.js";

const PRESET_ORDER = [
  "scroll-driven",
  "autoplay",
  "scroll-slowdown",
  "center-slowdown",
];

export const SPIRAL_FIELDS = [
  ...createSharedFields({
    presetOptions: PRESET_ORDER,
    defaultPreset: "autoplay",
    cycleMs: 25000,
  }),
  makeField({
    name: "animationDirection",
    attr: "data-animation-direction",
    defaultValue: "auto",
    group: "motion",
    label: "direction",
    control: "select",
    options: ["auto", "clockwise", "counter-clockwise"],
  }),
  makeField({
    name: "animationSpeed",
    attr: "data-animation-speed",
    defaultValue: SPIRAL_DEFAULTS.speed,
    parse: "number",
    group: "motion",
    label: "base speed",
    control: "number",
    min: 0,
    max: 0.01,
    step: 0.00001,
  }),
  makeField({
    name: "animationTurns",
    attr: "data-animation-turns",
    defaultValue: SPIRAL_DEFAULTS.turns,
    parse: "number",
    group: "geometry",
    label: "turns",
    control: "range",
    min: 0.25,
    max: 6,
    step: 0.05,
  }),
  makeField({
    name: "animationCardScale",
    attr: "data-animation-card-scale",
    defaultValue: SPIRAL_DEFAULTS.cardScale,
    parse: "number",
    group: "cards",
    label: "card scale",
    control: "range",
    min: 0.02,
    max: 0.8,
    step: 0.01,
  }),
  makeField({
    name: "animationCardGrowthScale",
    attr: "data-animation-card-growth-scale",
    defaultValue: SPIRAL_DEFAULTS.cardGrowthScale,
    parse: "number",
    group: "cards",
    label: "card growth scale",
    control: "range",
    min: 0,
    max: 4,
    step: 0.05,
  }),
  makeField({
    name: "animationRadiusScale",
    attr: "data-animation-radius-scale",
    defaultValue: SPIRAL_DEFAULTS.radiusScale,
    parse: "number",
    group: "geometry",
    label: "radius scale",
    control: "range",
    min: 0,
    max: 1.5,
    step: 0.01,
  }),
  makeField({
    name: "animationAlphaScale",
    attr: "data-animation-alpha-scale",
    defaultValue: SPIRAL_DEFAULTS.alphaScale,
    parse: "number",
    group: "effects",
    label: "alpha scale",
    control: "range",
    min: 0,
    max: 6,
    step: 0.05,
  }),
  makeField({
    name: "animationCardRadiusScale",
    attr: "data-animation-card-radius-scale",
    defaultValue: SPIRAL_DEFAULTS.cardRadiusScale,
    parse: "number",
    group: "cards",
    label: "card radius scale",
    control: "range",
    min: 0,
    max: 0.5,
    step: 0.01,
  }),
  makeField({
    name: "animationRotationOffset",
    attr: "data-animation-rotation-offset",
    defaultValue: Number((SPIRAL_DEFAULTS.rotationOffset * 180 / Math.PI).toFixed(4)),
    parse: "number",
    group: "geometry",
    label: "rotation offset, degrees",
    control: "range",
    min: -360,
    max: 360,
    step: 1,
  }),
];

export const SPIRAL_PRESETS = COMMON_PRESETS;

export function buildSpiralOptions(values) {
  const defaultDirection = SPIRAL_DEFAULTS.direction;
  const direction = values.animationDirection === "clockwise"
    ? 1
    : values.animationDirection === "counter-clockwise"
      ? -1
      : defaultDirection;

  return {
    speed: scaledSpeed(Math.abs(values.animationSpeed), values.animationDuration),
    turns: values.animationTurns,
    cardScale: values.animationCardScale,
    cardGrowthScale: values.animationCardGrowthScale,
    radiusScale: values.animationRadiusScale,
    alphaScale: values.animationAlphaScale,
    cardRadiusScale: values.animationCardRadiusScale,
    direction,
    rotationOffset: values.animationRotationOffset * Math.PI / 180,
    maxDpr: Math.max(1, values.animationMaxDpr),
    pauseOnReducedMotion: values.animationPauseOnReducedMotion,
    interaction: buildInteraction(values),
  };
}

export const mountSpiralComponent = (target, { items } = {}) => mountDataComponent(target, {
  mount: mountSpiral,
  items,
  fields: SPIRAL_FIELDS,
  presets: SPIRAL_PRESETS,
  buildOptions: buildSpiralOptions,
});
