export const BLOG_KINDS = ["tool", "course", "tutorial", "note"] as const;

export type BlogKind = (typeof BLOG_KINDS)[number];

export interface BlogCover {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

export interface BlogVideo {
  readonly provider: "youtube";
  readonly id: string;
  readonly title: string;
}

export interface BlogEntry {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly kind: BlogKind;
  readonly published: boolean;
  readonly publishedAt: string;
  readonly updatedAt?: string;
  readonly featured?: boolean;
  readonly tags: readonly string[];
  readonly cover?: BlogCover;
  readonly sourceName?: string;
  readonly externalUrl?: string;
  readonly video?: BlogVideo;
  readonly body: string;
}

export interface BlogEntryValidationInput {
  readonly filePath: string;
  readonly slug: string;
  readonly frontmatter: unknown;
  readonly body: string;
}
