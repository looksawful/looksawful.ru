import { JESTEI_THEME_DETAIL_METRICS } from "./jestei-theme-organism-data.js";
import { createJesteiThemeOrganism } from "./jestei-theme-organism.js";

export function createJesteiThemeOrganismDetailRenderer({
  motion,
  inlineRuntime = null,
} = {}) {
  return {
    ...JESTEI_THEME_DETAIL_METRICS,
    frame: "edge-to-edge",

    mount({ root }) {
      const organismRoot = root.querySelector(
        '[data-jestei-theme-organism][data-jestei-theme-instance="panel"]',
      );

      if (!(organismRoot instanceof HTMLElement)) return null;

      inlineRuntime?.pause?.();
      const organism = createJesteiThemeOrganism({
        root: organismRoot,
        motion,
      });

      if (!organism) {
        inlineRuntime?.resume?.();
        return null;
      }

      let destroyed = false;

      return {
        refresh() {
          if (!destroyed) organism.refresh();
        },

        destroy() {
          if (destroyed) return;
          destroyed = true;
          organism.destroy();
          inlineRuntime?.resume?.();
        },
      };
    },
  };
}
