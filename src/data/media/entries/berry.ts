import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const berryMediaEntries = [
  {
    id: "berry-02-source-01-9x16-use-01",
    assetId: "berry-02-source-01-9x16",
    projectIds: ["berry-social-content-2020"],
    alt: "",
    caption: {
        title: "Сторис с услугами в инстаграме",
        index: 1,
    }
},
  {
    id: "berry-02-source-02-9x16-use-01",
    assetId: "berry-02-source-02-9x16",
    projectIds: ["berry-social-content-2020"],
    alt: "",
    caption: {
        title: "Сторис с услугами в инстаграме",
        index: 2,
    }
},
  {
    id: "berry-02-source-03-9x16-use-01",
    assetId: "berry-02-source-03-9x16",
    projectIds: ["berry-social-content-2020"],
    alt: "",
    caption: {
        title: "Сторис с услугами в инстаграме",
        index: 3,
    }
},
  {
    id: "berry-02-source-04-9x16-use-01",
    assetId: "berry-02-source-04-9x16",
    projectIds: ["berry-social-content-2020"],
    alt: "",
    caption: {
        title: "Сторис с услугами в инстаграме",
        index: 4,
    }
},
  {
    id: "berry-03-source-06-2x3-use-01",
    assetId: "berry-03-source-06-2x3",
    alt: "Эдиториал с моделью Berry Agency",
    caption: {
        title: "Эдиториал съёмка с моделью агентства",
    },
    projectIds: ["shootings-berry-editorial", "berry-social-content-2020"]
},
  {
    id: "berry-05-source-01-1050x1400-use-01",
    assetId: "berry-05-source-01-1050x1400",
    alt: "Модельные тесты для Berry Agency",
    caption: {
        title: "Модельные тесты для агентства",
    },
    projectIds: ["shootings-berry-model-tests", "berry-social-content-2020"]
},
  {
    id: "berry-05-source-05-2000x2000-use-01",
    assetId: "berry-05-source-05-2000x2000",
    alt: "Лукбук Berry Agency",
    caption: {
        title: "Съёмка лукбука",
    },
    projectIds: ["shootings-berry-lookbook", "berry-social-content-2020"]
},
  {
    id: "berry-05-source-07-2144x2144-use-01",
    assetId: "berry-05-source-07-2144x2144",
    alt: "Предметная съёмка для бренда подарков",
    caption: {
        title: "Предметная съёмка для бренда подарков",
    },
    projectIds: ["shootings-berry-product", "berry-social-content-2020"]
},
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
