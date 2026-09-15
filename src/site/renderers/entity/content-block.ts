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

export function renderContentBlock(
  block: ContentBlock,
  options: ContentBlockRenderOptions = {},
): string {
  const editorialCopy = { showEditorialCopy: options.suppressCaptions !== true };

  switch (block.type) {
    case "code-block":
      return renderCodeBlock(block.data);
    case "media-figure":
      return renderMediaFigure(block.data, {
        ...editorialCopy,
        ...(options.reveal === false ? { reveal: false as const } : {}),
        ...(block.presentation?.mediaDimensions !== undefined
          ? { mediaDimensions: block.presentation.mediaDimensions }
          : {}),
      });
    case "media-group":
      return renderMediaGroup(block.data, editorialCopy);
    case "media-slider":
      return renderMediaSlider(block.data, editorialCopy);
    case "mockup":
      return renderMockup(block.data, editorialCopy);
    case "mockup-deck":
      return renderMockupDeck(block.data, editorialCopy);
    case "justified-gallery":
      return renderJustifiedGallery(block.data, editorialCopy);
    case "before-after":
      return renderBeforeAfter(block.data, editorialCopy);
    case "page-flip":
      return renderPageFlip(block.data, editorialCopy);
    case "animated-canvas-gallery":
      return renderAnimatedCanvasGallery(block.data, editorialCopy);
    case "jestei-theme":
      return renderJesteiThemeOrganismMockup(block.data);
    case "awful-cases-game":
      return renderAwfulCasesGame();
    default:
      return assertNeverContentBlock(block);
  }
}

export function renderContentBlocks(
  blocks: readonly ContentBlock[],
  options: ContentBlockRenderOptions = {},
): string {
  return blocks.map((block) => renderContentBlock(block, options)).join("\n");
}
