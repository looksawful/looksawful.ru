/* ==================================================
   Assets
   ================================================== */

export type MediaRating = 1 | 2 | 3 | 4 | 5;

/*
постоянная ручная оценка. В будущем отдельно появится вычисляемый score.
   1 — технически нужен, но не хочется показывать
   2 — слабый
   3 — нормальный
   4 — сильный
   5 — ключевой
   */

export interface MediaBase {
  id: string;
  src: string;
  width: number;
  height: number;
  date?: string;
  rating?: MediaRating;
}

export interface ImageMedia extends MediaBase {
  type: "image";
  alt: string;
}

export interface VideoMedia extends MediaBase {
  type: "video";
  poster?: string;
}

export type MediaAsset = ImageMedia | VideoMedia;

/* ==================================================
   Captions
   ================================================== */

export interface MediaCaptionData {
  index?: number;
  title: string;
  text?: string;
  meta?: readonly string[];
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
