import type { MediaFigureData, MockupData, ProjectIntroData } from "../../types/content.ts";
import type { MediaEntryId } from "../media/index.ts";
import type { LogoUsageId } from "../logos/index.ts";
import { awfulCasesEditorialContent } from "./awful-cases-editorial.ts";

export const awfulCasesIntro = {
  head: { type: "text", text: awfulCasesEditorialContent.head },
  title: { type: "text", text: awfulCasesEditorialContent.title },
  role: awfulCasesEditorialContent.role,
  period: awfulCasesEditorialContent.period,
  summary: awfulCasesEditorialContent.summary,
  lead: awfulCasesEditorialContent.lead,
  links: [
    { label: "GitHub", href: "https://github.com/looksawful/awful-cases", rel: "noopener", target: "_blank" },
    { label: "Download ZIP", href: "https://github.com/looksawful/awful-cases/archive/refs/heads/main.zip" },
  ],
} as const satisfies ProjectIntroData<LogoUsageId>;

export const awfulCasesDemo = {
  entryId: "awful-cases-assets-recording-2026-08-15-121210-use-01",
  presentation: "banner",
  captionView: "full",
  video: { autoplay: true, loop: true, muted: true, playsInline: true, preload: "auto" },
} as const satisfies MediaFigureData<MediaEntryId>;

export const awfulCasesSettingsMockup = {
  entryId: "awful-cases-assets-screenshot-2026-08-14-174113-use-01",
  device: "desktop",
  theme: "dark",
  captionView: "full",
  loading: "lazy",
} as const satisfies MockupData<MediaEntryId>;
