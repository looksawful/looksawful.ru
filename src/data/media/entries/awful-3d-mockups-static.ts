import type { MediaEntryData } from "../../../types/media.ts";
import type { MediaAssetId } from "../assets/index.ts";

export const awful3dMockupsStaticMediaEntries = [
  { id: "awful-3d-iphone-17-contact-use-01", assetId: "awful-3d-iphone-17-contact", purpose: "work", projectIds: ["awful-3d-mockups"], alt: "РќР°Р±РѕСЂ РїСЂРѕРІРµСЂРѕС‡РЅС‹С… СЂР°РєСѓСЂСЃРѕРІ 3D-РјРѕРєР°РїР° iPhone 17" },
  { id: "awful-3d-ipad-pro-11-contact-use-01", assetId: "awful-3d-ipad-pro-11-contact", purpose: "supporting", projectIds: ["awful-3d-mockups"], alt: "РќР°Р±РѕСЂ РїСЂРѕРІРµСЂРѕС‡РЅС‹С… СЂР°РєСѓСЂСЃРѕРІ 3D-РјРѕРєР°РїР° iPad Pro 11" },
  { id: "awful-3d-ipad-pro-13-contact-use-01", assetId: "awful-3d-ipad-pro-13-contact", purpose: "supporting", projectIds: ["awful-3d-mockups"], alt: "РќР°Р±РѕСЂ РїСЂРѕРІРµСЂРѕС‡РЅС‹С… СЂР°РєСѓСЂСЃРѕРІ 3D-РјРѕРєР°РїР° iPad Pro 13" },
  { id: "awful-3d-macbook-pro-14-contact-use-01", assetId: "awful-3d-macbook-pro-14-contact", purpose: "supporting", projectIds: ["awful-3d-mockups"], alt: "РќР°Р±РѕСЂ РїСЂРѕРІРµСЂРѕС‡РЅС‹С… СЂР°РєСѓСЂСЃРѕРІ 3D-РјРѕРєР°РїР° MacBook Pro 14" },
] as const satisfies readonly MediaEntryData<MediaAssetId>[];
