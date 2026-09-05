import type { createMotionPreference } from "../motion-preference.ts";

type MotionPreference = ReturnType<typeof createMotionPreference>;

export interface JesteiThemeOrganisms {
  destroy(): void;
  preload?(): void | Promise<void>;
}

export function preloadJesteiThemeOrganismAssets(
  options?: { modelUrl?: string },
): Promise<void>;

export function createJesteiThemeOrganisms(options: {
  root?: Document | HTMLElement;
  motion: MotionPreference;
}): JesteiThemeOrganisms | null;
