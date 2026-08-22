import type { MediaFigureData, MockupData, ProjectIntroData, SectionIntroData } from "../../types/content.ts";
import { getCase, getRole } from "../catalog/lookup.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";

const styxCase = getCase("styx");
const designerRole = getRole("designer");

export const styxIntro = {
  head: { type: "logo", logoUsageId: "styx-case-head-logo", wrapper: "name" },
  title: { type: "logo", logoUsageId: "styx-case-title-logo" },
  role: designerRole.name,
  period: styxCase.date,
  lead: "Возглавил комплексную работу над визуальной системой нишевого московского бренда украшений, аксессуаров и одежды, вдохновлённого готической романтикой и лавкрафтовским ужасом.",
} as const satisfies ProjectIntroData<LogoUsageId>;

export const styxBrandIntro = {
  title: "Сформировал ДНК бренда",
  paragraphs: ["Разработал логотип, собрал фирменный стиль, разработал дизайн упаковки, печатных материалов, соцсетей, рекламных публикаций, баннеров, продюсировал и снимал кампейны, лукбуки и каталоги, занимался технической, художественной и экспериментальной обработкой фотографий и создавал сканографические перекладные анимации и арты."],
} as const satisfies SectionIntroData;

export const styxLogoBanner = { entryId: "styx-logo-source-styx-logo-volume-use-01", presentation: "banner", captionView: "lightbox-only", loading: "lazy" } as const satisfies MediaFigureData<MediaEntryId>;

export const styxProductionIntro = {
  title: "Продакшен",
  paragraphs: ["Сформировал ДНК бренда: разработал логотип, собрал фирменный стиль, разработал дизайн упаковки, печатных материалов, соцсетей, рекламных публикаций, баннеров, продюсировал и снимал кампейны, лукбуки и каталоги, занимался технической, художественной и экспериментальной обработкой фотографий и создавал сканографические перекладные анимации и арты."],
} as const satisfies SectionIntroData;

export const styxScanographyIntro = {
  title: "Сканографии",
  paragraphs: ["Экспериментальная технология, которую я придумал для Styx. Я по отдельности сканировал объект разными сканерами и вручную монтировал полученные кадры, чтобы все искажения и эффекты были не цифровыми, а аналоговыми."],
} as const satisfies SectionIntroData;

export const styxCatalogMockup = { entryId: "styx-04-source-01-16x9-use-01", device: "desktop", theme: "dark", captionView: "summary", loading: "lazy" } as const satisfies MockupData<MediaEntryId>;
export const styxShootingsIntro = { title: "Съёмки", paragraphs: ["Для Styx я продюсировал и снимал лукбуки, кампейны и коллаборации, а затем собирал из материала каталожные, рекламные и экспериментальные визуалы бренда."] } as const satisfies SectionIntroData;
export const styxLookbookIntro = { title: "Лукбук", paragraphs: ["Съёмка лукбука Styx Jewel 2025 года."] } as const satisfies SectionIntroData;
