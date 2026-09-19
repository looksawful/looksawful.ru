import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const awfulStudioStaticMediaEntries = [
  { id: "awful-studio-scene-white-use-01", assetId: "awful-studio-scene-white", purpose: "work", projectIds: ["awful-studio"], alt: "Белая виртуальная предметная студия" },
  { id: "awful-studio-scene-loft-use-01", assetId: "awful-studio-scene-loft", purpose: "supporting", projectIds: ["awful-studio"], alt: "Виртуальная студия с дневным светом" },
  { id: "awful-studio-scene-neon-use-01", assetId: "awful-studio-scene-neon", purpose: "supporting", projectIds: ["awful-studio"], alt: "Тёмная виртуальная студия с неоновым светом" },
  { id: "awful-studio-rig-front-use-01", assetId: "awful-studio-rig-front", purpose: "supporting", projectIds: ["awful-studio"], alt: "Студийная стойка и импульсный источник света, вид спереди" },
  { id: "awful-studio-rig-three-quarter-use-01", assetId: "awful-studio-rig-three-quarter", purpose: "supporting", projectIds: ["awful-studio"], alt: "Студийная стойка и источник света в ракурсе три четверти" },
  { id: "awful-studio-rig-fixture-detail-use-01", assetId: "awful-studio-rig-fixture-detail", purpose: "supporting", projectIds: ["awful-studio"], alt: "Деталь корпуса студийного источника света" },
  { id: "awful-studio-rig-magnum-detail-use-01", assetId: "awful-studio-rig-magnum-detail", purpose: "supporting", projectIds: ["awful-studio"], alt: "Профиль рефлектора Magnum" },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
