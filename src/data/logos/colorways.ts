import type { LogoColorwayData } from "../../types/logo.ts";
import type { LogoFamilyId } from "./families.ts";

export const logoColorways = [
  {
    id: "jestei-bright",
    familyId: "jestei-pool",
    name: "Bright",
    intendedBackground: "dark",
    description: "Белая контрастная версия; используется, когда цветовая сегментация не нужна.",
  },
  {
    id: "jestei-dark",
    familyId: "jestei-pool",
    name: "Dark",
    intendedBackground: "light",
    description: "Чёрная контрастная версия; используется, когда цветовая сегментация не нужна.",
  },
  {
    id: "jestei-orange",
    familyId: "jestei-pool",
    name: "Orange",
    intendedBackground: "any",
    description: "Цветовая версия для Club.",
  },
  {
    id: "jestei-pear",
    familyId: "jestei-pool",
    name: "Pear",
    intendedBackground: "any",
    description: "Цветовая версия для Event.",
  },
  {
    id: "jestei-blue",
    familyId: "jestei-pool",
    name: "Blue",
    intendedBackground: "any",
    description: "Цветовая версия для PRO.",
  },
  {
    id: "jestei-biloba",
    familyId: "jestei-pool",
    name: "Biloba",
    intendedBackground: "any",
    description: "Цветовая версия для новых функций и feature-коммуникации.",
  },
] as const satisfies readonly LogoColorwayData<LogoFamilyId>[];

export type LogoColorway = (typeof logoColorways)[number];
export type LogoColorwayId = LogoColorway["id"];
