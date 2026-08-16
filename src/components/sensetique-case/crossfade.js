const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const noop = () => {};

export function createSensetiqueCrossfades(scene, { motion, signal } = {}) {
  const state = {
    documentVisible: document.visibilityState !== "hidden",
    motionAllowed:
      typeof motion?.allowsMotion === "function"
        ? motion.allowsMotion()
        : !window.matchMedia?.(REDUCED_MOTION_QUERY).matches,
  };

  const records = [...scene.querySelectorAll("[data-crossfade-slider]")]
    .map((slider) => {
      const slides = [...slider.querySelectorAll(":scope > [data-slider-slide]")];
      if (slides.length < 2) return null;

      const owner = slider.closest("figure, .sensetique-crossfade-media") ?? slider;
      const prev = owner.querySelector("[data-slider-prev]");
      const next = owner.querySelector("[data-slider-next]");
      const count = owner.querySelector("[data-slider-count]");
      const caption = owner.querySelector("[data-slider-caption]");
      const sequenceIndex = owner.querySelector("[data-slider-sequence-index]");
      const interval = Number.parseInt(slider.dataset.sliderInterval || "4200", 10);
      let index = Math.max(0, slides.findIndex((slide) => slide.hasAttribute("data-active")));
      let timer = 0;
      let visible = false;

      const stop = () => {
        if (!timer) return;
        window.clearInterval(timer);
        timer = 0;
      };

      const render = () => {
        slides.forEach((slide, slideIndex) => {
          slide.toggleAttribute("data-active", slideIndex === index);
        });

        if (count) {
          count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(
            slides.length,
          ).padStart(2, "0")}`;
        }

        const activeSlide = slides[index];
        if (caption) {
          caption.textContent =
            activeSlide.dataset.caption || activeSlide.getAttribute("alt") || "";
        }
        if (sequenceIndex && activeSlide.dataset.mediaSequence) {
          sequenceIndex.textContent = activeSlide.dataset.mediaSequence;
        }

        slider.dispatchEvent(
          new CustomEvent("sensetique:slidechange", {
            bubbles: true,
            detail: { slider, activeSlide, index },
          }),
        );
      };

      const move = (delta) => {
        index = (index + delta + slides.length) % slides.length;
        render();
      };

      const sync = () => {
        stop();
        if (!visible || !state.documentVisible || !state.motionAllowed) return;
        timer = window.setInterval(() => move(1), interval);
      };

      const setVisible = (nextVisible) => {
        if (visible === nextVisible) return;
        visible = nextVisible;
        sync();
      };

      prev?.addEventListener(
        "click",
        () => {
          move(-1);
          sync();
        },
        { signal },
      );
      next?.addEventListener(
        "click",
        () => {
          move(1);
          sync();
        },
        { signal },
      );
      owner.addEventListener("focusin", stop, { signal });
      owner.addEventListener("focusout", sync, { signal });

      render();
      return { owner, stop, sync, setVisible };
    })
    .filter(Boolean);

  if (!records.length) return noop;

  const syncAll = () => records.forEach((record) => record.sync());
  const recordByOwner = new Map(records.map((record) => [record.owner, record]));
  const observer =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              recordByOwner.get(entry.target)?.setVisible(entry.isIntersecting);
            });
          },
          { rootMargin: "20% 0px", threshold: 0.01 },
        )
      : null;

  if (observer) records.forEach((record) => observer.observe(record.owner));
  else records.forEach((record) => record.setVisible(true));

  const unsubscribeMotion =
    motion?.subscribe?.(
      ({ allowed }) => {
        state.motionAllowed = allowed === true;
        syncAll();
      },
      { immediate: false },
    ) ?? noop;

  document.addEventListener(
    "visibilitychange",
    () => {
      state.documentVisible = document.visibilityState !== "hidden";
      syncAll();
    },
    { signal },
  );

  return () => {
    observer?.disconnect();
    unsubscribeMotion();
    records.forEach((record) => record.stop());
  };
}
