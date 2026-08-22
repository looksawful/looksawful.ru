import type { LogoColorwayData } from "../../types/logo.ts";
import type { LogoFamilyId } from "./families.ts";

export const logoColorways = [
  {
    id: "jestei-black",
    familyId: "jestei-pool",
    name: "Чёрный",
    intendedBackground: "light",
  },
  {
    id: "jestei-white",
    familyId: "jestei-pool",
    name: "Белый",
    intendedBackground: "dark",
  },
  {
    id: "jestei-pear",
    familyId: "jestei-pool",
    name: "Грушевый",
    intendedBackground: "any",
  },
  {
    id: "jestei-gold",
    familyId: "jestei-pool",
    name: "Золотой",
    intendedBackground: "any",
  },
  {
    id: "jestei-blue",
    familyId: "jestei-pool",
    name: "Синий",
    intendedBackground: "any",
  },
  {
    id: "jestei-lavender",
    familyId: "jestei-pool",
    name: "Лавандовый",
    intendedBackground: "any",
  },
] as const satisfies readonly LogoColorwayData<LogoFamilyId>[];

export type LogoColorway = (typeof logoColorways)[number];
export type LogoColorwayId = LogoColorway["id"];
