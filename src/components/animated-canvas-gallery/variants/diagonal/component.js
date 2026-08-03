import { mountDiagonal, DIAGONAL_DEFAULTS } from "./index.js";
import { createRowComponentDefinition } from "../../runtime/master-runtime.js";

export const DIAGONAL_COMPONENT = createRowComponentDefinition({
  name: "diagonal",
  mount: mountDiagonal,
  defaults: DIAGONAL_DEFAULTS,
  cycleMs: 12000,
});

export const DIAGONAL_FIELDS = DIAGONAL_COMPONENT.fields;
export const DIAGONAL_PRESETS = DIAGONAL_COMPONENT.presets;
export const mountDiagonalComponent = DIAGONAL_COMPONENT.mountComponent;
