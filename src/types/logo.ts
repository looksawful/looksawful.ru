import type { CaseId } from "../data/catalog/cases.ts";
import type { ClientId } from "../data/catalog/clients.ts";

export type LogoSubjectRef =
  | {
      type: "client";
      id: ClientId;
    }
  | {
      type: "case";
      id: CaseId;
    }
  | {
      type: "project";
      id: string;
    };

export interface LogoFamilyData {
  id: string;
  name: string;
  subjects: readonly LogoSubjectRef[];
  description?: string;
}

export type LogoRevisionStatus =
  | "current"
  | "legacy"
  | "historical"
  | "concept";

export type LogoAuthorship =
  | "created-by-me"
  | "pre-existing"
  | "unknown";

export interface LogoRevisionData<FamilyId extends string = string> {
  id: string;
  familyId: FamilyId;
  name: string;
  status: LogoRevisionStatus;
  authorship?: LogoAuthorship;
  date?: string;
  description?: string;
  projectIds?: readonly string[];
}

export type LogoVariantKind =
  | "symbol"
  | "wordmark"
  | "lockup"
  | "monogram"
  | "other";

export type LogoOrientation =
  | "horizontal"
  | "stacked"
  | "vertical"
  | "square";

export interface LogoVariantData<RevisionId extends string = string> {
  id: string;
  revisionId: RevisionId;
  name: string;
  kind?: LogoVariantKind;
  orientation?: LogoOrientation;
  description?: string;
}

export type LogoBackgroundPreference =
  | "light"
  | "dark"
  | "any";

export interface LogoColorwayData<FamilyId extends string = string> {
  id: string;
  familyId: FamilyId;
  name: string;
  intendedBackground?: LogoBackgroundPreference;
  description?: string;
}

export type LogoTreatment =
  | "flat"
  | "3d"
  | "animated";

export interface LogoRenditionData<
  VariantId extends string = string,
  ColorwayId extends string = string,
> {
  id: string;
  variantId: VariantId;
  colorwayId?: ColorwayId;
  treatment: LogoTreatment;
  name?: string;
  description?: string;
}

export type LogoFileFormat =
  | "svg"
  | "png"
  | "webp"
  | "jpeg"
  | "avif"
  | "gif"
  | "pdf"
  | "ai"
  | "eps"
  | "mp4"
  | "webm"
  | "mov"
  | "glb"
  | "gltf"
  | "blend";

export type LogoFilePurpose =
  | "source"
  | "web"
  | "preview"
  | "model"
  | "animation";

export interface LogoFileData<
  FamilyId extends string = string,
  RevisionId extends string = string,
  RenditionId extends string = string,
  MediaAssetId extends string = string,
> {
  id: string;
  familyId: FamilyId;
  revisionId?: RevisionId;
  renditionId?: RenditionId;
  format: LogoFileFormat;
  purpose: LogoFilePurpose;
  src?: string;
  mediaAssetId?: MediaAssetId;
  width?: number;
  height?: number;
  description?: string;
}

export type LogoPlacement =
  | "logo-wall"
  | "site-header"
  | "case-header"
  | "case-title"
  | "navigation"
  | "menu"
  | "project-card"
  | "project-content"
  | "comparison"
  | "document"
  | "other";

export type LogoUsageContext =
  | {
      type: "site";
    }
  | {
      type: "client";
      id: ClientId;
    }
  | {
      type: "case";
      id: CaseId;
    }
  | {
      type: "project";
      id: string;
    };

export interface LogoUsageData<FileId extends string = string> {
  id: string;
  fileId: FileId;
  placement: LogoPlacement;
  context?: LogoUsageContext;
  alt?: string;
  description?: string;
}
