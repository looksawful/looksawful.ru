import {
  initProjectNavigationBackToTop,
  initProjectNavigationDock,
  initProjectNavigationFallback,
} from "./components/project-navigation.ts";

type Destroy = () => void;

type ScaledMockupFitOptions = {
  targetSelector: string;
  scaleProperty: string;
  heightProperty: string;
};

const noop: Destroy = () => {};

function syncPlaylistSummaryVisibility(root: ShadowRoot): void {
  const shell = root.querySelector(".contains-shell");
  if (!(shell instanceof HTMLElement)) return;

  const pills = Array.from(
    shell.querySelectorAll<HTMLElement>(".summary-pill"),
  );

  pills.forEach((pill) => pill.removeAttribute("data-summary-clipped"));

  const shellRect = shell.getBoundingClientRect();
  const tolerance = 1;

  pills.forEach((pill) => {
    const style = getComputedStyle(pill);
    const rect = pill.getBoundingClientRect();
    if (
      style.display === "none" ||
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return;
    }

    const visibleLeft = Math.max(rect.left, shellRect.left);
    const visibleRight = Math.min(rect.right, shellRect.right);
    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
    const isPartiallyVisible =
      visibleWidth > tolerance && visibleWidth < rect.width - tolerance;

    if (isPartiallyVisible) {
      pill.dataset.summaryClipped = "true";
    }
  });
}

function initPlaylistFilter(host: Element): Destroy {
  const root = host.shadowRoot;
  if (!root) return noop;

  const form = root.querySelector(".filter");
  if (!(form instanceof HTMLFormElement)) return noop;

  const summaryShell = root.querySelector(".contains-shell");
  let summaryFrame = 0;

  const syncSummaryVisibility = (): void => {
    summaryFrame = 0;
    syncPlaylistSummaryVisibility(root);
  };

  const queueSummaryVisibilitySync = (): void => {
    if (summaryFrame) return;
    summaryFrame = requestAnimationFrame(syncSummaryVisibility);
  };

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

  const handleClick = (event: Event): void => {
    const target = (event.target as Element).closest("[data-action]") as HTMLElement | null;
    if (!(target instanceof Element)) return;

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
      root
        .querySelectorAll<HTMLElement>("[data-selection]")
        .forEach((element) => (element.dataset.selection = "neutral"));
      form.dataset.hasFilters = "false";
    } else if (action === "mode" && target instanceof HTMLInputElement) {
      root
        .querySelectorAll<HTMLElement>(".track-state__option")
        .forEach((label) => (label.dataset.state = "inactive"));
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

      target.querySelectorAll<HTMLElement>("[data-key-variant-label]").forEach((label) => {
        label.dataset.state =
          label.dataset.keyVariantLabel === target.dataset.keyVariant
            ? "active"
            : "inactive";
      });
    }

    queueSummaryVisibilitySync();
  };

  const handleSubmit = (event: Event): void => event.preventDefault();

  root.addEventListener("click", handleClick);
  form.addEventListener("submit", handleSubmit);

  if (summaryShell instanceof HTMLElement) {
    summaryShell.addEventListener("scroll", queueSummaryVisibilitySync, {
      passive: true,
    });
  }

  const summaryObserver =
    summaryShell instanceof HTMLElement && typeof ResizeObserver === "function"
      ? new ResizeObserver(queueSummaryVisibilitySync)
      : null;

  if (summaryShell instanceof HTMLElement) {
    summaryObserver?.observe(summaryShell);
  }

  queueSummaryVisibilitySync();

  return () => {
    root.removeEventListener("click", handleClick);
    form.removeEventListener("submit", handleSubmit);
    if (summaryShell instanceof HTMLElement) {
      summaryShell.removeEventListener("scroll", queueSummaryVisibilitySync);
    }
    summaryObserver?.disconnect();
    if (summaryFrame) cancelAnimationFrame(summaryFrame);
  };
}

function initScaledMockupFit(
  mockup: Element,
  {
    targetSelector,
    scaleProperty,
    heightProperty,
  }: ScaledMockupFitOptions,
): Destroy {
  if (!(mockup instanceof HTMLElement)) return noop;

  const viewport = mockup.querySelector(".mockup__viewport");
  const target = mockup.querySelector(targetSelector);

  if (
    !(viewport instanceof HTMLElement) ||
    !(target instanceof HTMLElement)
  ) {
    return noop;
  }

  const render = (): void => {
    const viewportStyles = getComputedStyle(viewport);
    const paddingInline =
      (Number.parseFloat(viewportStyles.paddingInlineStart) || 0) +
      (Number.parseFloat(viewportStyles.paddingInlineEnd) || 0);

    const availableWidth = Math.max(0, viewport.clientWidth - paddingInline);
    const designWidth = target.offsetWidth;
    const designHeight = target.offsetHeight;

    if (!availableWidth || !designWidth || !designHeight) return;

    const scale = Math.min(1, availableWidth / designWidth);

    mockup.style.setProperty(scaleProperty, String(scale));
    mockup.style.setProperty(heightProperty, `${designHeight * scale}px`);
  };

  const observer =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(render)
      : null;

  observer?.observe(viewport);
  render();

  return () => {
    observer?.disconnect();
    mockup.style.removeProperty(scaleProperty);
    mockup.style.removeProperty(heightProperty);
  };
}

export function initSiteInteractive(
  { root = document }: { root?: Document | HTMLElement } = {},
): Destroy {
  const destroys: Destroy[] = [];

  destroys.push(initProjectNavigationDock(root));
  destroys.push(initProjectNavigationBackToTop(root));
  destroys.push(initProjectNavigationFallback(root));

  root.querySelectorAll("playlist-filter-workflow").forEach((host) => {
    destroys.push(initPlaylistFilter(host));
  });

  root.querySelectorAll(".jestei-filter-mockup").forEach((mockup) => {
    destroys.push(
      initScaledMockupFit(mockup, {
        targetSelector: "playlist-filter-workflow",
        scaleProperty: "--filter-fit-scale",
        heightProperty: "--filter-fit-height",
      }),
    );
  });

  root.querySelectorAll(".jestei-theme-organism-mockup").forEach((mockup) => {
    destroys.push(
      initScaledMockupFit(mockup, {
        targetSelector: "[data-jestei-theme-organism]",
        scaleProperty: "--jestei-theme-fit-scale",
        heightProperty: "--jestei-theme-fit-height",
      }),
    );
  });

  return () =>
    destroys
      .splice(0)
      .reverse()
      .forEach((destroy) => destroy());
}
