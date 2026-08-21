import { gsap } from "gsap";

const HERO_LETTER_EVENTS = [
  { type: "jump", index: 4, delay: 2.4, repeatDelay: 9.5, y: -8 },
  { type: "jump", index: 18, delay: 6.8, repeatDelay: 11.2, y: -8 },
  { type: "flip", index: 6, delay: 4.8, repeatDelay: 12 },
  { type: "wobble", index: 13, delay: 8.2, repeatDelay: 10.5, rotation: 6, y: -3 },
  { type: "stretch", index: 22, delay: 12.4, repeatDelay: 13.5, scaleX: 1.16, scaleY: 0.92 },
];

function initHeroLetterMotion(root, { motion } = {}) {
  if (!(root instanceof HTMLElement) || motion?.isReduced?.()) return;
  const letters = [...root.querySelectorAll("[data-hero-letter]")];
  if (!letters.length) return;
  const timelines = [];
  const context = gsap.context(() => {
    gsap.set(letters, { transformOrigin: "50% 58%", transformPerspective: 900, force3D: true });
    for (const event of HERO_LETTER_EVENTS) {
      const letter = letters[Math.abs(Math.trunc(event.index)) % letters.length];
      const tl = gsap.timeline({ repeat: -1, repeatDelay: event.repeatDelay, delay: event.delay });
      if (event.type === "flip") {
        tl.to(letter, { rotationX: 180, duration: 0.4, ease: "power2.inOut" })
          .to(letter, { rotationX: 360, duration: 0.46, ease: "power2.inOut" }, "+=.12")
          .set(letter, { rotationX: 0 });
      } else if (event.type === "wobble") {
        const r = event.rotation ?? 5,
          y = event.y ?? -2;
        tl.to(letter, { rotation: -r, y, duration: 0.23, ease: "power1.out" })
          .to(letter, { rotation: r * 0.84, y: 1, duration: 0.28, ease: "power1.inOut" })
          .to(letter, { rotation: -r * 0.34, y: 0, duration: 0.24, ease: "power1.inOut" })
          .to(letter, { rotation: 0, y: 0, duration: 0.36, ease: "power2.out" });
      } else if (event.type === "stretch") {
        tl.to(letter, {
          scaleX: event.scaleX ?? 1.08,
          scaleY: event.scaleY ?? 0.95,
          duration: 0.28,
          ease: "power2.out",
        }).to(letter, { scaleX: 1, scaleY: 1, duration: 0.44, ease: "power2.inOut" }, "+=.06");
      } else {
        tl.to(letter, { y: event.y ?? -6, duration: 0.2, ease: "power2.out" }).to(
          letter,
          { y: 0, duration: 0.42, ease: "power2.inOut" },
          "+=.28",
        );
      }
      timelines.push(tl);
    }
  }, root);
  const visibility = () => timelines.forEach((t) => (document.hidden ? t.pause() : t.play()));
  document.addEventListener("visibilitychange", visibility);
  return () => {
    document.removeEventListener("visibilitychange", visibility);
    timelines.forEach((t) => t.kill());
    context.revert();
  };
}

function initPlaylistFilter(host) {
  const root = host.shadowRoot;
  if (!root) return;
  const form = root.querySelector(".filter");
  if (!(form instanceof HTMLFormElement)) return;
  const cycle = (el) => {
    const current = el.dataset.selection || "neutral";
    el.dataset.selection =
      current === "neutral" ? "included" : current === "included" ? "excluded" : "neutral";
    form.dataset.hasFilters = "true";
  };
  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (!(target instanceof Element)) return;
    const action = target.dataset.action;
    if (action === "toggle-open") {
      const open = form.dataset.filterOpen !== "false";
      form.dataset.filterOpen = String(!open);
      target.setAttribute("aria-expanded", String(!open));
    } else if (action === "toggle-advanced") {
      form.dataset.filterAdvanced = String(form.dataset.filterAdvanced !== "true");
    } else if (
      action === "genre" ||
      action === "tag" ||
      action === "checkbox" ||
      action === "rating" ||
      action === "top" ||
      action === "key-toggle"
    ) {
      cycle(target);
    } else if (action === "reset") {
      root.querySelectorAll("[data-selection]").forEach((el) => (el.dataset.selection = "neutral"));
      form.dataset.hasFilters = "false";
    } else if (action === "mode" && target instanceof HTMLInputElement) {
      root
        .querySelectorAll(".track-state__option")
        .forEach((label) => (label.dataset.state = "inactive"));
      target.closest(".track-state__option")?.setAttribute("data-state", "active");
      form.dataset.mode = target.value;
    } else if (action === "drop-seed") {
      target.hidden = true;
    } else if (action === "key") {
      const dialog = root.querySelector("[data-key-dialog]");
      if (dialog instanceof HTMLDialogElement && !dialog.open) dialog.showModal();
    } else if (action === "key-cancel") {
      target.closest("dialog")?.close();
    } else if (action === "key-apply") {
      const dialog = target.closest("dialog");
      if (dialog instanceof HTMLDialogElement) dialog.close();
      form.dataset.hasFilters = "true";
    } else if (action === "key-clear") {
      const pill = root.querySelector("[data-key-selection-pill]");
      if (pill instanceof HTMLElement) pill.hidden = true;
      form.dataset.hasFilters = "true";
    } else if (action === "key-variant") {
      const classic = target.getAttribute("aria-pressed") === "true";
      target.setAttribute("aria-pressed", String(!classic));
      target.dataset.keyVariant = classic ? "camelot" : "classic";
      target.querySelectorAll("[data-key-variant-label]").forEach((label) => {
        label.dataset.state =
          label.dataset.keyVariantLabel === target.dataset.keyVariant ? "active" : "inactive";
      });
    }
  });
  form.addEventListener("submit", (event) => event.preventDefault());
}

function initMediaCaptionInteractions(root) {
  if (!root?.addEventListener) return () => {};

  const coarsePointer = window.matchMedia?.("(hover: none), (pointer: coarse)");
  const ownerSelector = "figure.media, figure.before-after";
  const managedOwnerSelector =
    'figure.media[data-caption="overlay"], figure.media[data-caption-rest], figure.before-after[data-caption-rest]';

  const hasManagedCaption = (figure) =>
    figure.matches(managedOwnerSelector) ||
    Boolean(
      figure.querySelector(":scope > .media__caption [data-slide-caption][data-caption-rest]"),
    );

  const captionOwnerFor = (element) => {
    let figure = element?.closest(ownerSelector);

    while (figure instanceof HTMLElement && root.contains(figure)) {
      if (hasManagedCaption(figure)) return figure;
      figure = figure.parentElement?.closest(ownerSelector);
    }

    return null;
  };

  const closeAll = (except = null) => {
    root
      .querySelectorAll("figure.media[data-caption-open], figure.before-after[data-caption-open]")
      .forEach((figure) => {
        if (figure !== except) figure.removeAttribute("data-caption-open");
      });
  };

  const handleClick = (event) => {
    if (!coarsePointer?.matches) return;

    const target = event.target instanceof Element ? event.target : null;
    const figure = target ? captionOwnerFor(target) : null;

    if (!(figure instanceof HTMLElement)) {
      closeAll();
      return;
    }

    if (target.closest("a, button, input, select, textarea")) return;

    const caption = target.closest(".media__caption");
    const ownsCaption = (caption ? captionOwnerFor(caption) : null) === figure;
    const open = figure.hasAttribute("data-caption-open");

    if (ownsCaption && open) {
      figure.removeAttribute("data-caption-open");
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    if (!open) {
      closeAll(figure);
      figure.setAttribute("data-caption-open", "");
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    // Second tap on the media keeps the normal click path alive so the
    // existing lightbox can open. Close the overlay before handing it off.
    figure.removeAttribute("data-caption-open");
  };

  const handleKeydown = (event) => {
    if (event.key === "Escape") {
      closeAll();
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") return;
    if (!(event.target instanceof HTMLElement) || captionOwnerFor(event.target) !== event.target) return;

    event.preventDefault();
    const open = event.target.toggleAttribute(
      "data-caption-open",
      !event.target.hasAttribute("data-caption-open"),
    );
    if (open) closeAll(event.target);
  };

  const handlePointerModeChange = () => {
    if (!coarsePointer?.matches) closeAll();
  };

  root.addEventListener("click", handleClick);
  root.addEventListener("keydown", handleKeydown);
  coarsePointer?.addEventListener?.("change", handlePointerModeChange);

  return () => {
    closeAll();
    root.removeEventListener("click", handleClick);
    root.removeEventListener("keydown", handleKeydown);
    coarsePointer?.removeEventListener?.("change", handlePointerModeChange);
  };
}

function initJesteiFilterFit(mockup) {
  if (!(mockup instanceof HTMLElement)) return () => {};

  const viewport = mockup.querySelector(".mockup__viewport");
  const filter = mockup.querySelector("playlist-filter-workflow");

  if (
    !(viewport instanceof HTMLElement) ||
    !(filter instanceof HTMLElement)
  ) {
    return () => {};
  }

  const render = () => {
    const viewportStyles = getComputedStyle(viewport);
    const paddingInline =
      (Number.parseFloat(viewportStyles.paddingInlineStart) || 0) +
      (Number.parseFloat(viewportStyles.paddingInlineEnd) || 0);

    const availableWidth = Math.max(0, viewport.clientWidth - paddingInline);
    const designWidth = filter.offsetWidth;
    const designHeight = filter.offsetHeight;

    if (!availableWidth || !designWidth || !designHeight) return;

    const scale = Math.min(1, availableWidth / designWidth);

    mockup.style.setProperty("--filter-fit-scale", String(scale));
    mockup.style.setProperty(
      "--filter-fit-height",
      `${designHeight * scale}px`,
    );
  };

  const observer =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(render)
      : null;

  observer?.observe(viewport);
  render();

  return () => {
    observer?.disconnect();
    mockup.style.removeProperty("--filter-fit-scale");
    mockup.style.removeProperty("--filter-fit-height");
  };
}


export function initSiteInteractive({ root = document, motion } = {}) {
  const destroys = [];
  destroys.push(initMediaCaptionInteractions(root));
  root.querySelectorAll("[data-hero-motion]").forEach((element) => {
    const destroy = initHeroLetterMotion(element, { motion });
    if (typeof destroy === "function") destroys.push(destroy);
  });
  root.querySelectorAll("playlist-filter-workflow").forEach(initPlaylistFilter);
  root.querySelectorAll(".jestei-filter-mockup").forEach((mockup) => {
    destroys.push(initJesteiFilterFit(mockup));
  });
  return () => destroys.splice(0).reverse().forEach((destroy) => destroy?.());
}
