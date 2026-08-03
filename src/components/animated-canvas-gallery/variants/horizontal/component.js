import { mountHorizontal, HORIZONTAL_DEFAULTS } from "./index.js";
import { createRowComponentDefinition } from "../../runtime/master-runtime.js";

export const HORIZONTAL_COMPONENT = createRowComponentDefinition({
  name: "horizontal",
  mount: mountHorizontal,
  defaults: HORIZONTAL_DEFAULTS,
  cycleMs: 12000,
});

export const HORIZONTAL_FIELDS = HORIZONTAL_COMPONENT.fields;
export const HORIZONTAL_PRESETS = HORIZONTAL_COMPONENT.presets;
export const mountHorizontalComponent = HORIZONTAL_COMPONENT.mountComponent;
