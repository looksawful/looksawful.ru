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

export interface CreditsData {
  title?: string;
  lines?: readonly string[];
}

export interface ResourceLinkData {
  label: string;
  href: string;
  rel?: string;
  target?: "_blank";
  download?: string;
}

export interface ResourceLinksData {
  text: string;
  links: readonly ResourceLinkData[];
}

export type SectionNoteKind = "group" | "editorial";

export interface SectionNoteData {
  text: string;
  link?: ResourceLinkData;
  kind?: SectionNoteKind;
}

export interface SectionIntroData {
  title: string;
  paragraphs?: readonly string[];
  bodyClassName?: string;
}

export type EntityIntroTitleData<LogoUsageId extends string = string> =
  | {
      type: "logo";
      logoUsageId: LogoUsageId;
    }
  | {
      type: "text";
      text: string;
    };

export type EntityIntroHeadData<LogoUsageId extends string = string> =
  | {
      type: "logo";
      logoUsageId: LogoUsageId;
      wrapper?: "none" | "name";
    }
  | {
      type: "text";
      text: string;
    };

export interface EntityIntroLinkData {
  label: string;
  href: string;
  rel?: string;
  target?: "_blank";
}

export interface EntityIntroData<LogoUsageId extends string = string> {
  head?: EntityIntroHeadData<LogoUsageId>;
  title: EntityIntroTitleData<LogoUsageId>;
  role?: string;
  period?: string;
  summary?: string;
  lead?: string;
  linksLabel?: string;
  links?: readonly EntityIntroLinkData[];
}

/** @deprecated Use EntityIntroTitleData. */
export type ProjectIntroTitleData<LogoUsageId extends string = string> =
  EntityIntroTitleData<LogoUsageId>;

/** @deprecated Use EntityIntroHeadData. */
export type ProjectIntroHeadData<LogoUsageId extends string = string> =
  EntityIntroHeadData<LogoUsageId>;

/** @deprecated Use EntityIntroLinkData. */
export type ProjectIntroLinkData = EntityIntroLinkData;

/** @deprecated Use EntityIntroData. */
export type ProjectIntroData<LogoUsageId extends string = string> =
  EntityIntroData<LogoUsageId>;
