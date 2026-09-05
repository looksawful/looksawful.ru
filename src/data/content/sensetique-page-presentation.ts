import type { PageFlipData } from "../../types/page-flip.ts";
import type {
  CreditsData,
  ResourceLinksData,
  SectionNoteData,
} from "../../types/content.ts";
import type { MediaEntryId } from "../media/index.ts";
import { sensetiqueDigitalFearPageFlip } from "./sensetique.ts";

export const sensetiqueEquipmentResources = {
  text: "В студии были импульсный и постоянный свет, насадки, отражатели и другое съёмочное оборудование.",
  links: [
    {
      label: "Полный список оборудования · PDF",
      href: "https://www.looksawful.ru/media/projects/sensetique/15/source/01-equipment-sensetique.pdf",
      rel: "noopener noreferrer",
      target: "_blank",
    },
  ],
} as const satisfies ResourceLinksData;

export const sensetiquePublicationsNote = {
  kind: "editorial",
  text: "Публиковали съёмки в российских и европейских изданиях и работали с редакциями над спецпроектами.",
} as const satisfies SectionNoteData;

export const sensetiqueFashionProductionNote = {
  kind: "editorial",
  text: "Для российских независимых дизайнеров и брендов одежды снимали лукбуки, кампейны, видео и каталоги.",
} as const satisfies SectionNoteData;

export const sensetiqueMasterclassesNote = {
  kind: "editorial",
  text: "В студии проводили мастер-классы и интенсивы с приглашёнными авторами.",
} as const satisfies SectionNoteData;

export const sensetiqueMasterclassesCredits = {
  lines: ["в коллаборации с Simple Stories School."],
} as const satisfies CreditsData;

export const sensetiqueHarshLightOuterCredits = {
  lines: [
    "Фотограф Андрей Рапуто",
    "стилист Мария Жукова",
    "продюсер Иван Крушинский",
  ],
} as const satisfies CreditsData;

export const sensetiqueKrasotaDressOuterCredits = {
  lines: [
    "Фотограф Дарья Сеничева",
    "стилист Мария Жукова.",
    "продюсер Иван Крушинский",
  ],
} as const satisfies CreditsData;

export const sensetiqueOlovoCampaignOuterCredits = {
  lines: [
    "продюсер Иван Крушинский",
    "фотограф Никита Игнатов",
    "стилист Мария Жукова.",
  ],
} as const satisfies CreditsData;

export const sensetiqueOlovoArchitectureOuterCredits = {
  lines: ["Фотограф Дарья Сеничева"],
} as const satisfies CreditsData;

export const sensetiqueCanonicalDigitalFearPageFlip = {
  ...sensetiqueDigitalFearPageFlip,
  credits: {
    ...sensetiqueDigitalFearPageFlip.credits,
    title: "Digital Fear of Love",
  },
} as const satisfies PageFlipData<MediaEntryId>;
