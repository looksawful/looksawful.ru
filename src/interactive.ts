import {
  initProjectNavigationBackToTop,
  initProjectNavigationFallback,
  initProjectNavigationViewportAnchor,
} from "./components/project-navigation.ts";

type Destroy = () => void;

export interface SiteInteractiveOptions {
  root?: Document | HTMLElement;
}

const noop: Destroy = () => {};

function initPlaylistFilter(host: Element): void {
  const root = host.shadowRoot;
  if (!root) return;

  const form = root.querySelector(".filter");
  if (!(form instanceof HTMLFormElement)) return;

  const cycle = (element: HTMLElement): void => {
    const current = element.dataset.selection || "neutral";
    element.dataset.selection =
      current === "neutral"
        ? "included"
        : current === "included"
          ? "excluded"
          : "neutral";
    form.dataset.hasFilters = "true";
  };

  root.addEventListener("click", (event) => {
    const eventTarget = event.target;
    if (!(eventTarget instanceof Element)) return;

    const target = eventTarget.closest("[data-action]");
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.action;

    if (action === "toggle-open") {
      const open = form.dataset.filterOpen !== "false";
      form.dataset.filterOpen = String(!open);
      target.setAttribute("aria-expanded", String(!open));
    } else if (action === "toggle-advanced") {
      form.dataset.filterAdvanced = String(
        form.dataset.filterAdvanced !== "true",
      );
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
      root.querySelectorAll("[data-selection]").forEach((element) => {
        if (element instanceof HTMLElement) {
          element.dataset.selection = "neutral";
        }
      });
      form.dataset.hasFilters = "false";
    } else if (action === "mode" && target instanceof HTMLInputElement) {
      root.querySelectorAll(".track-state__option").forEach((label) => {
        if (label instanceof HTMLElement) {
          label.dataset.state = "inactive";
        }
      });
      target
        .closest(".track-state__option")
        ?.setAttribute("data-state", "active");
      form.dataset.mode = target.value;
    } else if (action === "drop-seed") {
      target.hidden = true;
    } else if (action === "key") {
      const dialog = root.querySelector("[data-key-dialog]");
      if (dialog instanceof HTMLDialogElement && !dialog.open) {
        dialog.showModal();
      }
    } else if (action === "key-cancel") {
      const dialog = target.closest("dialog");
      if (dialog instanceof HTMLDialogElement) dialog.close();
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
        if (!(label instanceof HTMLElement)) return;
        label.dataset.state =
          label.dataset.keyVariantLabel === target.dataset.keyVariant
            ? "active"
            : "inactive";
      });
    }
  });

  form.addEventListener("submit", (event) => event.preventDefault());
}

function initJesteiFilterFit(mockup: Element): Destroy {
  if (!(mockup instanceof HTMLElement)) return noop;

  const viewport = mockup.querySelector(".mockup__viewport");
  const filter = mockup.querySelector("playlist-filter-workflow");

  if (
    !(viewport instanceof HTMLElement) ||
    !(filter instanceof HTMLElement)
  ) {
    return noop;
  }

  const render = (): void => {
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

function initJesteiThemeOrganismFit(mockup: Element): Destroy {
  if (!(mockup instanceof HTMLElement)) return noop;

  const viewport = mockup.querySelector(".mockup__viewport");
  const organism = mockup.querySelector("[data-jestei-theme-organism]");

  if (
    !(viewport instanceof HTMLElement) ||
    !(organism instanceof HTMLElement)
  ) {
    return noop;
  }

  const render = (): void => {
    const viewportStyles = getComputedStyle(viewport);
    const paddingInline =
      (Number.parseFloat(viewportStyles.paddingInlineStart) || 0) +
      (Number.parseFloat(viewportStyles.paddingInlineEnd) || 0);

    const availableWidth = Math.max(0, viewport.clientWidth - paddingInline);
    const designWidth = organism.offsetWidth;
    const designHeight = organism.offsetHeight;

    if (!availableWidth || !designWidth || !designHeight) return;

    const scale = Math.min(1, availableWidth / designWidth);

    mockup.style.setProperty("--jestei-theme-fit-scale", String(scale));
    mockup.style.setProperty(
      "--jestei-theme-fit-height",
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
    mockup.style.removeProperty("--jestei-theme-fit-scale");
    mockup.style.removeProperty("--jestei-theme-fit-height");
  };
}

export function initSiteInteractive(
  { root = document }: SiteInteractiveOptions = {},
): Destroy {
  const destroys: Destroy[] = [];

  destroys.push(initProjectNavigationBackToTop(root));
  destroys.push(initProjectNavigationViewportAnchor(root));
  destroys.push(initProjectNavigationFallback(root));

  root.querySelectorAll("playlist-filter-workflow").forEach(initPlaylistFilter);

  root.querySelectorAll(".jestei-filter-mockup").forEach((mockup) => {
    destroys.push(initJesteiFilterFit(mockup));
  });

  root.querySelectorAll(".jestei-theme-organism-mockup").forEach((mockup) => {
    destroys.push(initJesteiThemeOrganismFit(mockup));
  });

  return () =>
    destroys
      .splice(0)
      .reverse()
      .forEach((destroy) => destroy());
}
