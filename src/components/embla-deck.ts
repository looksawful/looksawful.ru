import EmblaCarousel, {
  type EmblaCarouselType,
  type EmblaOptionsType,
} from "embla-carousel";

type EmblaDeckOptions = {
  viewport: HTMLElement;
  active: boolean;
  startIndex: number;
  onPointerDown: () => void;
  onPointerUp: () => void;
  onSelect: (index: number) => void;
};

type ReInitOptions = {
  active: boolean;
  startIndex: number;
};

export type EmblaDeckController = {
  selectedScrollSnap: () => number;
  scrollToIndex: (index: number, jump?: boolean) => void;
  reInit: (options: ReInitOptions) => void;
  destroy: () => void;
};

function optionsFor({ active, startIndex }: ReInitOptions): EmblaOptionsType {
  return {
    active,
    align: "start",
    axis: "x",
    containScroll: false,
    dragFree: false,
    loop: false,
    skipSnaps: false,
    startIndex,
  };
}

export function createEmblaDeck({
  viewport,
  active,
  startIndex,
  onPointerDown,
  onPointerUp,
  onSelect,
}: EmblaDeckOptions): EmblaDeckController {
  const embla = EmblaCarousel(viewport, optionsFor({ active, startIndex }));

  const syncSelected = (api: EmblaCarouselType): void => {
    onSelect(api.selectedScrollSnap());
  };

  const handlePointerDown = (): void => {
    onPointerDown();
  };

  const handlePointerUp = (): void => {
    onPointerUp();
  };

  embla.on("select", syncSelected);
  embla.on("pointerDown", handlePointerDown);
  embla.on("pointerUp", handlePointerUp);
  embla.scrollTo(startIndex, true);

  return {
    selectedScrollSnap: () => embla.selectedScrollSnap(),
    scrollToIndex: (index, jump = false) => {
      embla.scrollTo(index, jump);
    },
    reInit: (options) => {
      embla.reInit(optionsFor(options));

      if (options.active) {
        embla.scrollTo(options.startIndex, true);
      }
    },
    destroy: () => {
      embla.destroy();
    },
  };
}
