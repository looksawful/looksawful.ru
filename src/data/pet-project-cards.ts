import type { SubprojectCardData } from "./subproject-cards.ts";

export type PetProjectBadge = "new";

type PetProjectCardBase = Omit<SubprojectCardData, "href"> & {
  badge?: PetProjectBadge;
};

export type PetProjectCardData =
  | (PetProjectCardBase & {
      state: "live";
      href: string;
    })
  | (PetProjectCardBase & {
      state: "coming-soon";
      href?: never;
    });

export const petProjectCards = [
  {
    id: "awful-cases",
    title: "Awful Cases",
    description: "Утилита для Windows: регистр и типографика выделенного текста.",
    coverEntryId: "awful-cases-assets-screenshot-2026-08-14-174113-use-01",
    shape: "landscape",
    href: "/work/awful-cases/",
    source: "site",
    state: "live",
  },
  {
    id: "moves-awful",
    title: "Moves Awful",
    description: "Библиотека с шаблонами анимированных canvas галерей для лендингов.",
    coverEntryId: "moves-awful-jestei-landing-animation-01-use-01",
    shape: "landscape",
    href: "/work/moves-awful/",
    source: "site",
    state: "live",
  },
  {
    id: "berserk-timer",
    title: "Berserk Timer",
    description: "Консольный помодоро-таймер для Windows.",
    coverEntryId: "berserk-timer-cover-use-01",
    shape: "landscape",
    source: "site",
    state: "coming-soon",
  },
  {
    id: "awful-studio",
    title: "AWFUL STUDIO",
    description: "Расширение Blender для сборки виртуальной предметной студии.",
    // Temporary canonical-catalog placeholder. The final card art is connected
    // only when AWFUL STUDIO is ready to leave the preview-only state.
    coverEntryId: "berserk-timer-cover-use-01",
    shape: "landscape",
    source: "site",
    state: "coming-soon",
  },
] as const satisfies readonly PetProjectCardData[];
