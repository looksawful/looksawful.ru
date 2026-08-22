export type MediaLoading = "eager" | "lazy";

export type MediaCaptionView =
  | "full"
  | "summary"
  | "overlay"
  | "lightbox-only";

export type MediaPresentation = "banner";

export type MediaPreload = "none" | "metadata" | "auto";

export interface MediaVideoOptions {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: MediaPreload;
}

export interface MediaCaptionPresentation {
  captionView: MediaCaptionView;
}

export interface MediaFigureData<EntryId extends string = string>
  extends MediaCaptionPresentation {
  entryId: EntryId;

  presentation?: MediaPresentation;
  loading?: MediaLoading;

  className?: string;
  mediaClassName?: string;

  video?: MediaVideoOptions;
}

export type MockupDevice = "desktop" | "mobile";

export interface MockupData<EntryId extends string = string>
  extends MediaCaptionPresentation {
  entryId: EntryId;

  device: MockupDevice;

  role?: string;
  theme?: string;

  loading?: MediaLoading;

  className?: string;
  mediaClassName?: string;

  video?: MediaVideoOptions;
}

export interface SectionIntroData {
  title: string;
  paragraphs?: readonly string[];
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
