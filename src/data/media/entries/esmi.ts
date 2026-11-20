import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const esmiMediaEntries = [
  {
    id: "esmi-12-source-01-1x1-use-01",
    assetId: "esmi-12-source-01-1x1",
    projectIds: ["shootings-esmi"],
    alt: "",
    caption: {
        title: "Обложка сингла Esmi, 2025.",
        meta: [
            "Фотограф: Иван Крушинский, лейбл ВК Музыка.",
        ],
    }
},
  {
    id: "esmi-12-source-01-1x1-use-02",
    assetId: "esmi-12-source-01-1x1",
    projectIds: ["shootings-esmi"],
    alt: "",
    caption: {
        title: "Обложка сингла Esmi, 2025.",
        index: 33,
        meta: [
            "Фотограф: Иван Крушинский, лейбл ВК Музыка.",
        ],
    }
},
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
