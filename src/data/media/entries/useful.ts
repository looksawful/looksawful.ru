import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const usefulMediaEntries = [
  {
    id: "useful-awful-cases-cover-use-01",
    assetId: "useful-awful-cases-cover",
    posterAssetId: "useful-awful-cases-cover-poster",
    projectIds: ["awful-cases"],
    alt: "Пиксельный рыцарь на белом коне из Awful Cases",
  },
  {
    id: "useful-moves-awful-cover-use-01",
    assetId: "useful-moves-awful-cover",
    posterAssetId: "useful-moves-awful-cover-poster",
    projectIds: ["moves-awful"],
    alt: "Анимированная секция Moves Awful",
  },
  {
    id: "useful-berserk-timer-cover-use-01",
    assetId: "useful-berserk-timer-cover",
    projectIds: ["berserk-timer"],
    alt: "Berserk Timer с зелёным ASCII-логотипом",
  },
  {
    id: "useful-awful-studio-cover-use-01",
    assetId: "useful-awful-studio-cover",
    alt: "Белая виртуальная студия Awful Studio",
  },
  {
    id: "useful-awful-mockups-cover-use-01",
    assetId: "useful-awful-mockups-cover",
    alt: "Человек держит телефон крупно в камеру",
  },
  {
    id: "useful-awful-3d-mockups-cover-use-01",
    assetId: "useful-awful-3d-mockups-cover",
    alt: "Белая композиция с 3D-мокапами устройств",
  },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
