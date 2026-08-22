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

export interface ProjectIntroData<LogoUsageId extends string = string> {
  headLogoUsageId?: LogoUsageId;

  title: ProjectIntroTitleData<LogoUsageId>;

  role?: string;
  period?: string;

  summary?: string;
  lead?: string;
}
