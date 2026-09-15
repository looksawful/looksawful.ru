import { MasonryInfiniteGrid } from "@egjs/infinitegrid";

export interface GalleryMasonryController {
  relayout(): void;
  destroy(): void;
}

export function galleryColumnCount(inlineSize: number): 2 | 3 | 4 | 5 {
  if (inlineSize > 1500) return 5;
  if (inlineSize > 1050) return 4;
  if (inlineSize > 720) return 3;
  return 2;
}

function measuredGap(grid: HTMLElement): number {
  const style = getComputedStyle(grid);
  const value = Number.parseFloat(style.columnGap);
  return Number.isFinite(value) ? value : 8;
}

function createMasonry(grid: HTMLElement, column: 2 | 3 | 4 | 5): MasonryInfiniteGrid {
  const gap = measuredGap(grid);
  return new MasonryInfiniteGrid(grid, {
    column,
    gap: { horizontal: gap, vertical: gap },
    // SSR cards intentionally start at width:100% as a usable no-JS fallback.
    // Stretch makes MasonryGrid assign the computed column width before
    // positioning those cards. Child observation stays off because intrinsic
    // media geometry is already known and observing the unchanged SSR width
    // prevents the initial stretch width from being committed by ItemRenderer.
    align: "stretch",
    useResizeObserver: true,
    observeChildren: false,
    autoResize: true,
    preserveUIOnDestroy: false,
    useRecycle: false,
  });
}

const EMPTY_CONTROLLER: GalleryMasonryController = {
  relayout: () => {},
  destroy: () => {},
};

export function createGalleryMasonry(root: HTMLElement): GalleryMasonryController {
  const grid = root.querySelector<HTMLElement>("[data-gallery-grid]");
  if (!grid) return EMPTY_CONTROLLER;

  let lastInlineSize = grid.clientWidth;
  let columnCount = galleryColumnCount(lastInlineSize);
  let masonry = createMasonry(grid, columnCount);
  masonry.renderItems();

  const rebuild = (): void => {
    const nextInlineSize = grid.clientWidth;
    const nextColumns = galleryColumnCount(nextInlineSize);
    const inlineSizeChanged = Math.abs(nextInlineSize - lastInlineSize) >= 1;

    if (!inlineSizeChanged) {
      masonry.updateItems();
      return;
    }

    lastInlineSize = nextInlineSize;
    if (nextColumns === columnCount) {
      masonry.updateItems();
      return;
    }

    masonry.destroy();
    columnCount = nextColumns;
    masonry = createMasonry(grid, columnCount);
    masonry.renderItems();
  };

  const resizeObserver = new ResizeObserver(rebuild);
  resizeObserver.observe(grid);

  return {
    relayout: () => masonry.updateItems(),
    destroy: () => {
      resizeObserver.disconnect();
      masonry.destroy();
    },
  };
}
