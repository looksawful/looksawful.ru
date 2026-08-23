const PAGE_FLIP_SRC = "https://unpkg.com/page-flip@2.0.7/dist/js/page-flip.browser.js";

type PageFlipOrientation = "portrait" | "landscape";
type PageFlipCorner = "bottom";

type PageFlipEvent = {
  data?: unknown;
};

type PageFlipOptions = {
  width: number;
  height: number;
  size: "stretch";
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  drawShadow: boolean;
  flippingTime: number;
  usePortrait: boolean;
  startZIndex: number;
  startPage: number;
  autoSize: boolean;
  maxShadowOpacity: number;
  showCover: boolean;
  mobileScrollSupport: boolean;
  swipeDistance: number;
  clickEventForward: boolean;
  useMouseEvents: boolean;
  showPageCorners: boolean;
  disableFlipByClick: boolean;
};

type PageFlipEventName = "init" | "flip" | "changeOrientation";
type PageFlipEventCallback = (event?: PageFlipEvent) => void;

interface PageFlipInstance {
  on(eventName: PageFlipEventName, callback: PageFlipEventCallback): void;
  loadFromHTML(pages: NodeListOf<HTMLElement>): void;
  getCurrentPageIndex(): number;
  getPageCount(): number;
  flipPrev(corner: PageFlipCorner): void;
  flipNext(corner: PageFlipCorner): void;
  destroy?(): void;
}

type PageFlipConstructor = new (book: HTMLElement, options: PageFlipOptions) => PageFlipInstance;

type MotionPreferenceLike = {
  allowsMotion?: () => boolean;
};

type CreatePageFlipOptions = {
  motion?: MotionPreferenceLike;
};

type CreatePageFlipsOptions = CreatePageFlipOptions & {
  root?: ParentNode;
};

declare global {
  interface Window {
    St?: {
      PageFlip?: PageFlipConstructor;
    };
  }
}

let loader: Promise<PageFlipConstructor> | null = null;

function loadPageFlip(): Promise<PageFlipConstructor> {
  if (window.St?.PageFlip) return Promise.resolve(window.St.PageFlip);
  if (loader) return loader;

  loader = new Promise<PageFlipConstructor>((resolve, reject) => {
    const existing = document.querySelector('script[data-page-flip-library]');
    const script = existing instanceof HTMLScriptElement ? existing : document.createElement("script");

    const loaded = () => (window.St?.PageFlip ? resolve(window.St.PageFlip) : reject(new Error("PageFlip loaded without St.PageFlip")));
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", () => reject(new Error("PageFlip failed to load")), { once: true });

    if (!existing) {
      script.src = PAGE_FLIP_SRC;
      script.async = true;
      script.dataset.pageFlipLibrary = "";
      document.head.append(script);
    }
  }).catch((error: unknown) => {
    loader = null;
    console.error(error);
    throw error;
  });

  return loader;
}

export function createPageFlip(root: unknown, { motion }: CreatePageFlipOptions = {}) {
  if (!(root instanceof HTMLElement)) return () => {};
  let pageFlip: PageFlipInstance | null = null;
  let disposed = false;
  let observer: IntersectionObserver | null = null;
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  let orientation: PageFlipOrientation = root.getBoundingClientRect().width <= 50 * rootFontSize ? "portrait" : "landscape";

  const mount = async () => {
    if (disposed || pageFlip) return;
    observer?.disconnect();
    observer = null;

    try {
      const PageFlip = await loadPageFlip();
      if (disposed) return;

      const book = root.querySelector("[data-page-flip-book]");
      const pages = book?.querySelectorAll<HTMLElement>(".page-flip__page");
      const prev = root.querySelector("[data-page-flip-prev]");
      const next = root.querySelector("[data-page-flip-next]");
      const count = root.querySelector("[data-page-flip-count]");
      if (!(book instanceof HTMLElement) || !pages?.length) return;

      pageFlip = new PageFlip(book, {
        width: 550,
        height: 778,
        size: "stretch",
        minWidth: 260,
        maxWidth: 580,
        minHeight: 368,
        maxHeight: 820,
        drawShadow: motion?.allowsMotion?.() ?? true,
        flippingTime: motion?.allowsMotion?.() === false ? 0 : 1180,
        usePortrait: true,
        startZIndex: 0,
        startPage: 0,
        autoSize: true,
        maxShadowOpacity: 0.18,
        showCover: false,
        mobileScrollSupport: false,
        swipeDistance: 8,
        clickEventForward: false,
        useMouseEvents: true,
        showPageCorners: true,
        disableFlipByClick: false,
      });

      const update = () => {
        if (!pageFlip) return;
        const current = pageFlip.getCurrentPageIndex();
        const pageCount = pageFlip.getPageCount();
        const portrait = orientation === "portrait";
        const position = portrait ? current + 1 : Math.floor(current / 2) + 1;
        const total = portrait ? pageCount : Math.ceil(pageCount / 2);

        if (count) {
          count.textContent = `${String(position).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
        }
        if (prev instanceof HTMLButtonElement) prev.disabled = current <= 0;
        if (next instanceof HTMLButtonElement) {
          next.disabled = current >= pageCount - (portrait ? 1 : 2);
        }
      };

      pageFlip.on("init", update);
      pageFlip.on("flip", update);
      pageFlip.on("changeOrientation", (event) => {
        orientation = event?.data === "portrait" ? "portrait" : "landscape";
        root.dataset.pageFlipOrientation = orientation;
        update();
      });
      pageFlip.loadFromHTML(pages);
      prev?.addEventListener("click", () => pageFlip?.flipPrev("bottom"));
      next?.addEventListener("click", () => pageFlip?.flipNext("bottom"));
      update();
    } catch {
      root.dataset.pageFlipState = "error";
    }
  };

  if (typeof IntersectionObserver === "function") {
    observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      if (entries.some((entry) => entry.isIntersecting)) void mount();
    }, { rootMargin: "100% 0px", threshold: 0.01 });
    observer.observe(root);
  } else {
    void mount();
  }

  return () => {
    disposed = true;
    observer?.disconnect();
    pageFlip?.destroy?.();
    pageFlip = null;
  };
}

export function createPageFlips({ root = document, motion }: CreatePageFlipsOptions = {}) {
  const destroys = [...root.querySelectorAll<HTMLElement>("[data-page-flip]")].map((element) => createPageFlip(element, { motion }));
  return () => destroys.splice(0).reverse().forEach((destroy) => destroy?.());
}

export { PAGE_FLIP_SRC };
