import { mountShowcaseDiagonal, SHOWCASE_DIAGONAL_DEFAULTS } from "./index.js";
import { createRowComponentDefinition } from "../../runtime/master-runtime.js";

export const SHOWCASE_DIAGONAL_COMPONENT = createRowComponentDefinition({
  name: "showcase-diagonal",
  mount: mountShowcaseDiagonal,
  defaults: SHOWCASE_DIAGONAL_DEFAULTS,
  cycleMs: 14000,
});

export const SHOWCASE_DIAGONAL_FIELDS = SHOWCASE_DIAGONAL_COMPONENT.fields;
export const SHOWCASE_DIAGONAL_PRESETS = SHOWCASE_DIAGONAL_COMPONENT.presets;
export const mountShowcaseDiagonalComponent = SHOWCASE_DIAGONAL_COMPONENT.mountComponent;
