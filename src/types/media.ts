/* ==================================================
   Rating
   ================================================== */

export type MediaRating = 1 | 2 | 3 | 4 | 5;

/*
  Постоянная ручная оценка. В будущем отдельно появится вычисляемый score.
  1 — технически нужен, но не хочется показывать
  2 — слабый
  3 — нормальный
  4 — сильный
  5 — ключевой
*/

/* ==================================================
   Assets
   ================================================== */

export interface MediaBase {
  id: string;
  src: string;
  width?: number;
  height?: number;
  date?: string;
  rating?: MediaRating;
}

export interface ImageMedia extends MediaBase {
  type: "image";
}

export interface VideoMedia extends MediaBase {
  type: "video";
  /** Original master used by media tooling when `src` points at an optimized delivery asset. */
  sourceSrc?: string;
}

export type MediaAsset = ImageMedia | VideoMedia;

/* ==================================================
   Captions
   ================================================== */

export interface MediaCaptionData {
  /** @deprecated Display numbering is derived from DOM order inside `.project__section`. */
  index?: number;
  title?: string;
  text?: string;
  meta?: readonly string[];
}

/* ==================================================
   Entries
   ================================================== */

export type MediaPurpose =
  | "supporting"
  | "work";

export interface MediaEntryData<
  AssetId extends string = string,
  ProjectId extends string = string,
  CreditId extends string = string,
> {
  id: string;
  assetId: AssetId;
  projectIds?: readonly ProjectId[];
  creditId?: CreditId;
  alt?: string;
  posterAssetId?: AssetId;
  caption?: MediaCaptionData;
  purpose?: MediaPurpose;
}

/* ==================================================
   Credits
   ================================================== */

export interface MediaCreditItem {
  role: string;
  names: readonly string[];
}

export interface MediaCreditsData {
  id: string;
  items: readonly MediaCreditItem[];
}
