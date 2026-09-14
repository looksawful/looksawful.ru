import {
  renderBeforeAfter,
  renderCodeBlock,
  renderJustifiedGallery,
  renderMediaFigure,
  renderMediaGroup,
  renderMediaSlider,
  renderMockup,
  renderMockupDeck,
  renderPageFlip,
} from "../../../components/content/index.ts";
import {
  renderAnimatedCanvasGallery,
  renderAwfulCasesGame,
  renderJesteiThemeOrganismMockup,
} from "../../../components/specialized/index.ts";
import {
  assertNeverContentBlock,
  type ContentBlock,
} from "../../../content/contracts/content-block.ts";

export interface ContentBlockRenderOptions {
  reveal?: boolean;
  suppressCaptions?: boolean;
}

function stripFigureCaptions(html: string): string {
  return html.replace(/\s*<figcaption\b[^>]*class="[^"]*\bmedia__caption\b[^"]*"[^>]*>[\s\S]*?<\/figcaption>/gi, "");
}

function stripMediaGroupHead(html: string): string {
  return html.replace(/\s*<header\b[^>]*class="[^"]*\bmedia-group__head\b[^"]*"[^>]*>[\s\S]*?<\/header>/gi, "");
}

function renderCaptionless(block: ContentBlock, html: string): string {
  if (block.type === "media-group") return stripMediaGroupHead(stripFigureCaptions(html));
  if (block.type === "mockup" || block.type === "media-figure" || block.type === "before-after") {
    return stripFigureCaptions(html);
  }
  return html;
}

export function renderContentBlock(
  block: ContentBlock,
  options: ContentBlockRenderOptions = {},
): string {
  let html: string;

  switch (block.type) {
    case "code-block":
      html = renderCodeBlock(block.data);
      break;
    case "media-figure":
      html = renderMediaFigure(block.data, {
        ...(options.reveal === false ? { reveal: false as const } : {}),
        ...(block.presentation?.mediaDimensions !== undefined
          ? { mediaDimensions: block.presentation.mediaDimensions }
          : {}),
      });
      break;
    case "media-group":
      html = renderMediaGroup(block.data);
      break;
    case "media-slider":
      html = renderMediaSlider(block.data);
      break;
    case "mockup":
      html = renderMockup(block.data);
      break;
    case "mockup-deck":
      html = renderMockupDeck(
        options.suppressCaptions ? { ...block.data, captions: false } : block.data,
      );
      break;
    case "justified-gallery":
      html = renderJustifiedGallery(block.data);
      break;
    case "before-after":
      html = renderBeforeAfter(block.data);
      break;
    case "page-flip":
      html = renderPageFlip(block.data);
      break;
    case "animated-canvas-gallery":
      html = renderAnimatedCanvasGallery(block.data);
      break;
    case "jestei-theme":
      html = renderJesteiThemeOrganismMockup(block.data);
      break;
    case "awful-cases-game":
      html = renderAwfulCasesGame();
      break;
    default:
      return assertNeverContentBlock(block);
  }

  return options.suppressCaptions ? renderCaptionless(block, html) : html;
}

export function renderContentBlocks(
  blocks: readonly ContentBlock[],
  options: ContentBlockRenderOptions = {},
): string {
  return blocks.map((block) => renderContentBlock(block, options)).join("\n");
}
