export type {
  MediaCaptionPresentation,
  MediaCaptionView,
  MediaFigureData,
  MediaLoading,
  MediaPresentation,
  MediaPreload,
  MediaVideoOptions,
  MockupData,
  MockupDevice,
} from "./media-presentation.ts";

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
