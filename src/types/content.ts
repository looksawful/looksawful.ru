export type MediaLoading = "eager" | "lazy";

export type MediaCaptionRest = "none" | "summary";

export type MediaCaptionMode = "default" | "overlay";

export type MediaPresentation = "banner";

export type MediaPreload = "none" | "metadata" | "auto";

export interface MediaVideoOptions {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: MediaPreload;
}

export interface MediaFigureData<EntryId extends string = string> {
  entryId: EntryId;

  presentation?: MediaPresentation;
  captionRest?: MediaCaptionRest;
  captionMode?: MediaCaptionMode;

  loading?: MediaLoading;

  className?: string;
  mediaClassName?: string;

  tabIndex?: 0;

  video?: MediaVideoOptions;
}

export type MockupDevice = "desktop" | "mobile";

export interface MockupData<EntryId extends string = string> {
  entryId: EntryId;

  device: MockupDevice;

  role?: string;
  theme?: string;

  captionRest?: MediaCaptionRest;
  captionMode?: MediaCaptionMode;

  loading?: MediaLoading;

  className?: string;
  mediaClassName?: string;

  tabIndex?: 0;

  video?: MediaVideoOptions;
}

export interface SectionIntroData {
  title: string;
  paragraphs?: readonly string[];

  /**
   * Дополнительный класс для общего контейнера текста.
   *
   * Если указан, paragraphs рендерятся внутри:
   *
   * <div class="section-copy__text ${bodyClassName}">
   *   <p>...</p>
   * </div>
   *
   * Если не указан — сохраняется обычная структура:
   *
   * <p class="section-copy__text">...</p>
   */
  bodyClassName?: string;
}

export type ProjectIntroTitleData<LogoUsageId extends string = string> =
  | {
      type: "logo";
      logoUsageId: LogoUsageId;
    }
  | {
      type: "text";
      text: string;
    };

export type ProjectIntroHeadData<LogoUsageId extends string = string> =
  | {
      type: "logo";
      logoUsageId: LogoUsageId;

      /**
       * "none":
       *   <img ...>
       *
       * "name":
       *   <p class="project__name"><img ...></p>
       */
      wrapper?: "none" | "name";
    }
  | {
      type: "text";
      text: string;
    };

export interface ProjectIntroLinkData {
  label: string;
  href: string;

  rel?: string;
  target?: "_blank";
}

export interface ProjectIntroData<LogoUsageId extends string = string> {
  head?: ProjectIntroHeadData<LogoUsageId>;

  title: ProjectIntroTitleData<LogoUsageId>;

  role?: string;
  period?: string;

  summary?: string;
  lead?: string;

  linksLabel?: string;
  links?: readonly ProjectIntroLinkData[];
}
