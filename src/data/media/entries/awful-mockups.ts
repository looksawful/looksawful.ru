import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const awfulMockupsMediaEntries = [
  {
    id: "awful-mockups-03-phone-fashion-use-01",
    assetId: "awful-mockups-03-phone-fashion",
    purpose: "primary",
    projectIds: ["awful-mockups"],
    alt: "Мокап телефона в постановочной сцене с человеком",
  },
  {
    id: "awful-mockups-17-dual-phone-use-01",
    assetId: "awful-mockups-17-dual-phone",
    purpose: "supporting",
    projectIds: ["awful-mockups"],
    alt: "Два телефона в вертикальной композиции",
  },
  {
    id: "awful-mockups-28-phone-camera-use-01",
    assetId: "awful-mockups-28-phone-camera",
    purpose: "supporting",
    projectIds: ["awful-mockups"],
    alt: "Телефон рядом с компактной камерой",
  },
  {
    id: "awful-mockups-39-print-case-use-01",
    assetId: "awful-mockups-39-print-case",
    purpose: "supporting",
    projectIds: ["awful-mockups"],
    alt: "Печатный материал в прозрачном футляре",
  },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
