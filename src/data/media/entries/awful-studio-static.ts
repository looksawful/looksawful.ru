import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const awfulStudioStaticMediaEntries = [
  { id: "awful-studio-scene-white-use-01", assetId: "awful-studio-scene-white", purpose: "work", projectIds: ["awful-studio"], alt: "Р‘РµР»Р°СЏ РІРёСЂС‚СѓР°Р»СЊРЅР°СЏ РїСЂРµРґРјРµС‚РЅР°СЏ СЃС‚СѓРґРёСЏ" },
  { id: "awful-studio-scene-loft-use-01", assetId: "awful-studio-scene-loft", purpose: "supporting", projectIds: ["awful-studio"], alt: "Р’РёСЂС‚СѓР°Р»СЊРЅР°СЏ СЃС‚СѓРґРёСЏ СЃ РґРЅРµРІРЅС‹Рј СЃРІРµС‚РѕРј" },
  { id: "awful-studio-scene-neon-use-01", assetId: "awful-studio-scene-neon", purpose: "supporting", projectIds: ["awful-studio"], alt: "РўС‘РјРЅР°СЏ РІРёСЂС‚СѓР°Р»СЊРЅР°СЏ СЃС‚СѓРґРёСЏ СЃ РЅРµРѕРЅРѕРІС‹Рј СЃРІРµС‚РѕРј" },
  { id: "awful-studio-rig-front-use-01", assetId: "awful-studio-rig-front", purpose: "supporting", projectIds: ["awful-studio"], alt: "РЎС‚СѓРґРёР№РЅР°СЏ СЃС‚РѕР№РєР° Рё РёРјРїСѓР»СЊСЃРЅС‹Р№ РёСЃС‚РѕС‡РЅРёРє СЃРІРµС‚Р°, РІРёРґ СЃРїРµСЂРµРґРё" },
  { id: "awful-studio-rig-three-quarter-use-01", assetId: "awful-studio-rig-three-quarter", purpose: "supporting", projectIds: ["awful-studio"], alt: "РЎС‚СѓРґРёР№РЅР°СЏ СЃС‚РѕР№РєР° Рё РёСЃС‚РѕС‡РЅРёРє СЃРІРµС‚Р° РІ СЂР°РєСѓСЂСЃРµ С‚СЂРё С‡РµС‚РІРµСЂС‚Рё" },
  { id: "awful-studio-rig-fixture-detail-use-01", assetId: "awful-studio-rig-fixture-detail", purpose: "supporting", projectIds: ["awful-studio"], alt: "Р”РµС‚Р°Р»СЊ РєРѕСЂРїСѓСЃР° СЃС‚СѓРґРёР№РЅРѕРіРѕ РёСЃС‚РѕС‡РЅРёРєР° СЃРІРµС‚Р°" },
  { id: "awful-studio-rig-magnum-detail-use-01", assetId: "awful-studio-rig-magnum-detail", purpose: "supporting", projectIds: ["awful-studio"], alt: "РџСЂРѕС„РёР»СЊ СЂРµС„Р»РµРєС‚РѕСЂР° Magnum" },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
