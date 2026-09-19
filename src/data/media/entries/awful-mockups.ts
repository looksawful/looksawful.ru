import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const awfulMockupsMediaEntries = [
  { id: "awful-mockups-02-monitor-use-01", assetId: "awful-mockups-02-monitor", purpose: "work", projectIds: ["awful-mockups"], alt: "Мокап экрана в рабочей сцене" },
  { id: "awful-mockups-03-phone-fashion-use-01", assetId: "awful-mockups-03-phone-fashion", purpose: "work", projectIds: ["awful-mockups"], alt: "Мокап телефона в постановочной сцене с человеком" },
  { id: "awful-mockups-11-square-use-01", assetId: "awful-mockups-11-square", purpose: "supporting", projectIds: ["awful-mockups"], alt: "Квадратный мокап из набора Awful Mockups" },
  { id: "awful-mockups-16-landscape-use-01", assetId: "awful-mockups-16-landscape", purpose: "supporting", projectIds: ["awful-mockups"], alt: "Горизонтальный мокап из набора Awful Mockups" },
  { id: "awful-mockups-17-dual-phone-use-01", assetId: "awful-mockups-17-dual-phone", purpose: "supporting", projectIds: ["awful-mockups"], alt: "Два телефона в вертикальной композиции" },
  { id: "awful-mockups-18-phone-use-01", assetId: "awful-mockups-18-phone", purpose: "supporting", projectIds: ["awful-mockups"], alt: "Мокап телефона с редактируемым экраном" },
  { id: "awful-mockups-28-phone-camera-use-01", assetId: "awful-mockups-28-phone-camera", purpose: "supporting", projectIds: ["awful-mockups"], alt: "Телефон рядом с компактной камерой" },
  { id: "awful-mockups-39-print-case-use-01", assetId: "awful-mockups-39-print-case", purpose: "supporting", projectIds: ["awful-mockups"], alt: "Печатный материал в прозрачном футляре" },
  { id: "awful-mockups-photoshop-layers-full-use-01", assetId: "awful-mockups-photoshop-layers-full", purpose: "supporting", projectIds: ["awful-mockups"], alt: "Мокап открыт в Photoshop с раскрытой структурой слоёв" },
  { id: "awful-mockups-photoshop-layers-detail-use-01", assetId: "awful-mockups-photoshop-layers-detail", purpose: "supporting", projectIds: ["awful-mockups"], alt: "Фрагмент интерфейса Photoshop со слоями мокапа" },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
