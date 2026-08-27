import type { MediaEntryId } from "../media/index.ts";
import type {
  JesteiThemeData,
  JesteiThemeOrganismMockupData,
} from "../../types/jestei-theme-organism.ts";

export const jesteiThemeOrganismThemes = [
  {
    name: "neutral",
    label: "Neutral",
    description: "\u00a0",
    tokens: [
      { name: "neutral", value: "#000000", rgb: "0 0 0" },
      { name: "dark", value: "#3C3C3C", rgb: "60 60 60" },
      { name: "mid", value: "#969696", rgb: "150 150 150" },
      { name: "light", value: "#E4E4E4", rgb: "228 228 228" },
    ],
  },
  {
    name: "basic",
    label: "Basic",
    description: "Для клубных диджеев. Основной цвет ленты треков и клубного контента.",
    tokens: [
      { name: "basic", value: "#F08000", rgb: "240 128 0" },
      { name: "dark", value: "#814705", rgb: "129 71 5" },
      { name: "mid", value: "#EAA556", rgb: "234 165 86" },
      { name: "light", value: "#D3B087", rgb: "211 176 135" },
    ],
  },
  {
    name: "event",
    label: "Event",
    description:
      "Для ивент-диджеев. Отмечает подборки и инструменты для свадеб, корпоративов и частных мероприятий.",
    tokens: [
      { name: "event", value: "#D0E232", rgb: "208 226 50" },
      { name: "dark", value: "#788318", rgb: "120 131 24" },
      { name: "mid", value: "#D7E087", rgb: "215 224 135" },
      { name: "light", value: "#CDD2A2", rgb: "205 210 162" },
    ],
  },
  {
    name: "pro",
    label: "Pro",
    description:
      "Для диджеев с расширенным доступом. Отмечает эксклюзивные эдиты, миксы и специальные продукты.",
    tokens: [
      { name: "pro", value: "#147AFF", rgb: "20 122 255" },
      { name: "dark", value: "#064494", rgb: "6 68 148" },
      { name: "mid", value: "#78ABEE", rgb: "120 171 238" },
      { name: "light", value: "#9AB5DA", rgb: "154 181 218" },
    ],
  },
  {
    name: "feature",
    label: "Feature",
    description:
      "Для всех пользователей. Отмечает новые и экспериментальные функции, не привязанные к одному разделу.",
    tokens: [
      { name: "feature", value: "#B19FE9", rgb: "177 159 233" },
      { name: "dark", value: "#4D2EAD", rgb: "77 46 173" },
      { name: "mid", value: "#A695DB", rgb: "166 149 219" },
      { name: "light", value: "#E0DCEC", rgb: "224 220 236" },
    ],
  },
] as const satisfies readonly JesteiThemeData[];

export const jesteiThemeOrganismMockup = {
  modelEntryId: "jestei-theme-organism-model-use-01",
  dracoPath: "/vendor/draco/gltf/",
  className: "jestei-theme-organism-mockup",
  device: "desktop",
  ratio: "16 / 10",
  ariaLabel: "Цветовые темы Jestei Pool",
  loadingLabel: "Загружается интерактивная цветовая система Jestei Pool",
  initialTheme: "neutral",
  themes: jesteiThemeOrganismThemes,
} as const satisfies JesteiThemeOrganismMockupData<MediaEntryId>;
