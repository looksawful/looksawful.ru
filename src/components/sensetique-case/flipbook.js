const PAGE_FLIP_SRC =
  "https://unpkg.com/page-flip@2.0.7/dist/js/page-flip.browser.js";
const noop = () => {};
let pageFlipLoader = null;

function loadPageFlip() {
  if (window.St?.PageFlip) return Promise.resolve(window.St.PageFlip);
  if (pageFlipLoader) return pageFlipLoader;

  pageFlipLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sensetique-page-flip]');
    const script =
      existing instanceof HTMLScriptElement
        ? existing
        : document.createElement("script");

    const handleLoad = () => {
      if (window.St?.PageFlip) resolve(window.St.PageFlip);
      else reject(new Error("PageFlip loaded without St.PageFlip."));
    };
    const handleError = () => reject(new Error("PageFlip failed to load."));

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existing) {
      script.src = PAGE_FLIP_SRC;
      script.async = true;
      script.dataset.sensetiquePageFlip = "";
      document.head.append(script);
    }
  }).catch((error) => {
    pageFlipLoader = null;
    console.error("Sensetique: не удалось загрузить flipbook.", error);
    throw error;
  });

  return pageFlipLoader;
}

export function createSensetiqueFlipbook(scene, { signal } = {}) {
  const section = scene.querySelector("[data-sensetique-flipbook-section]");
  if (!(section instanceof HTMLElement)) return noop;

  let pageFlip = null;
  let disposed = false;
  let mounting = null;
  let observer = null;

  const mount = () => {
    if (pageFlip || disposed) return mounting ?? Promise.resolve();
    if (mounting) return mounting;

    observer?.disconnect();
    observer = null;

    mounting = loadPageFlip()
      .then((PageFlip) => {
        if (disposed || pageFlip) return;

        const book = section.querySelector("[data-sensetique-flipbook]");
        const pages = book?.querySelectorAll(".sensetique-flipbook__page");
        const prev = section.querySelector(".sensetique-flipbook-prev");
        const next = section.querySelector(".sensetique-flipbook-next");
        const count = section.querySelector(".sensetique-flipbook-count");
        if (!(book instanceof HTMLElement) || !pages?.length || !prev || !next || !count) {
          return;
        }

        pageFlip = new PageFlip(book, {
          width: 550,
          height: 778,
          size: "stretch",
          minWidth: 260,
          maxWidth: 580,
          minHeight: 368,
          maxHeight: 820,
          drawShadow: true,
          flippingTime: 1180,
          usePortrait: false,
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
          const spread = Math.floor(current / 2) + 1;
          const total = Math.ceil(pageFlip.getPageCount() / 2);
          count.textContent = `${String(spread).padStart(2, "0")} / ${String(total).padStart(
            2,
            "0",
          )}`;
          prev.disabled = current <= 0;
          next.disabled = current >= pageFlip.getPageCount() - 2;
        };

        pageFlip.on("init", update);
        pageFlip.on("flip", update);
        pageFlip.loadFromHTML(pages);
        prev.addEventListener("click", () => pageFlip?.flipPrev("bottom"), { signal });
        next.addEventListener("click", () => pageFlip?.flipNext("bottom"), { signal });
        update();
      })
      .catch(() => {})
      .finally(() => {
        mounting = null;
      });

    return mounting;
  };

  if (typeof IntersectionObserver === "function") {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void mount();
      },
      { rootMargin: "100% 0px", threshold: 0.01 },
    );
    observer.observe(section);
  } else {
    void mount();
  }

  return () => {
    disposed = true;
    observer?.disconnect();
    observer = null;
    pageFlip?.destroy?.();
    pageFlip = null;
  };
}

export { PAGE_FLIP_SRC };
