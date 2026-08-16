import { createMediaLightbox } from "../media-lightbox/media-lightbox.js";

const MOVES_AWFUL_SELECTOR = "[data-moves-awful]";
const TABS_SELECTOR = "[data-moves-awful-tabs]";
const PANEL_SELECTOR = "[data-moves-awful-panel]";
const SCREEN_SELECTOR = ".moves-awful-browser .browser-mockup__screen";
const MOBILE_STAGE_QUERY = "(max-width: 50rem)";
const MOBILE_STAGE_WIDTH = 1280;
const TAB_AUTOPLAY_MS = 5000;
const INSTANCE = Symbol.for("looksawful.movesAwful.instance");

const noop = () => {};

function panelLabel(panel, index) {
  return (
    panel.dataset.movesAwfulTabLabel?.trim() ||
    `view ${index + 1}`
  );
}

function capturePanelState(panel) {
  return {
    hidden: panel.hidden,
    id: panel.getAttribute("id"),
    role: panel.getAttribute("role"),
    ariaHidden: panel.getAttribute("aria-hidden"),
    ariaLabelledby: panel.getAttribute("aria-labelledby"),
    active: panel.hasAttribute("data-moves-awful-active"),
  };
}

function restoreAttribute(element, name, value) {
  if (value == null) {
    element.removeAttribute(name);
    return;
  }

  element.setAttribute(name, value);
}


function createStageScaler(showcase) {
  const screen = showcase.querySelector(SCREEN_SELECTOR);

  if (
    !(screen instanceof HTMLElement) ||
    typeof ResizeObserver !== "function"
  ) {
    return {
      sync: noop,
      destroy: noop,
    };
  }

  const mobileQuery =
    window.matchMedia(MOBILE_STAGE_QUERY);

  const sync = () => {
    if (!mobileQuery.matches) {
      showcase.style.removeProperty(
        "--moves-awful-stage-scale",
      );
      return;
    }

    const width = screen.clientWidth;
    if (width <= 0) return;

    showcase.style.setProperty(
      "--moves-awful-stage-scale",
      String(width / MOBILE_STAGE_WIDTH),
    );
  };

  const observer = new ResizeObserver(sync);
  observer.observe(screen);

  mobileQuery.addEventListener?.(
    "change",
    sync,
  );

  sync();

  return {
    sync,
    destroy() {
      observer.disconnect();

      mobileQuery.removeEventListener?.(
        "change",
        sync,
      );

      showcase.style.removeProperty(
        "--moves-awful-stage-scale",
      );
    },
  };
}

function createMovesAwfulInstance(showcase, instanceIndex, accordionRuntime) {
  showcase[INSTANCE]?.destroy();

  const tabs = showcase.querySelector(TABS_SELECTOR);
  const panels = Array.from(showcase.querySelectorAll(PANEL_SELECTOR)).filter(
    (panel) => panel instanceof HTMLElement,
  );

  if (!(tabs instanceof HTMLElement) || panels.length < 2) {
    return null;
  }

  const stageScaler = createStageScaler(showcase);
  const scene = showcase.closest(
    ".cv-item--moves-awful",
  );
  const destroyMediaLightbox =
    createMediaLightbox({
      root:
        scene instanceof HTMLElement
          ? scene
          : showcase,
    });

  const originalTabsRole = tabs.getAttribute("role");
  const panelStates = panels.map(capturePanelState);
  const listenerCleanups = [];
  let autoplayTimer = null;
  let sceneActive = accordionRuntime ? false : true;
  let sceneDocumentVisible =
    accordionRuntime
      ? false
      : document.visibilityState !== "hidden";

  tabs.setAttribute("role", "tablist");

  const buttons = panels.map((panel, panelIndex) => {
    const panelId =
      panel.id || `moves-awful-${instanceIndex + 1}-panel-${panelIndex + 1}`;
    const tabId = `moves-awful-${instanceIndex + 1}-tab-${panelIndex + 1}`;

    panel.id = panelId;
    panel.setAttribute("role", "tabpanel");

    const button = document.createElement("button");
    button.className = "moves-awful-tabs__button";
    button.type = "button";
    button.id = tabId;
    button.textContent = panelLabel(panel, panelIndex);
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panelId);

    panel.setAttribute("aria-labelledby", tabId);
    tabs.append(button);

    return button;
  });

  let activeIndex = panels.findIndex((panel) =>
    panel.hasAttribute("data-moves-awful-active"),
  );

  if (activeIndex < 0) {
    activeIndex = panels.findIndex((panel) => !panel.hidden);
  }

  if (activeIndex < 0) {
    activeIndex = 0;
  }

  function clearAutoplay() {
    if (autoplayTimer !== null) {
      window.clearTimeout(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function scheduleAutoplay() {
    clearAutoplay();

    if (!sceneActive || !sceneDocumentVisible) {
      return;
    }

    autoplayTimer = window.setTimeout(() => {
      activate((activeIndex + 1) % panels.length);
      scheduleAutoplay();
    }, TAB_AUTOPLAY_MS);
  }

  function activate(index, { focus = false, resetAutoplay = false } = {}) {
    const nextIndex = Math.max(0, Math.min(panels.length - 1, index));
    activeIndex = nextIndex;

    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === activeIndex;

      panel.hidden = !active;
      panel.toggleAttribute("data-moves-awful-active", active);
      panel.setAttribute("aria-hidden", String(!active));
    });

    buttons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeIndex;

      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });

    if (resetAutoplay) {
      scheduleAutoplay();
    }

    if (focus) {
      buttons[activeIndex]?.focus();
    }
  }

  buttons.forEach((button, buttonIndex) => {
    const handleClick = () => activate(buttonIndex, { resetAutoplay: true });

    const handleKeydown = (event) => {
      let nextIndex = null;

      switch (event.key) {
        case "ArrowRight":
          nextIndex = (activeIndex + 1) % buttons.length;
          break;
        case "ArrowLeft":
          nextIndex = (activeIndex - 1 + buttons.length) % buttons.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = buttons.length - 1;
          break;
        default:
          return;
      }

      event.preventDefault();
      activate(nextIndex, { focus: true, resetAutoplay: true });
    };

    button.addEventListener("click", handleClick);
    button.addEventListener("keydown", handleKeydown);

    listenerCleanups.push(() => {
      button.removeEventListener("click", handleClick);
      button.removeEventListener("keydown", handleKeydown);
    });
  });

  activate(activeIndex);

  const unsubscribeScene =
    accordionRuntime?.subscribeScene?.(
      scene instanceof HTMLElement ? scene : showcase,
      ({ active, documentVisible } = {}) => {
        sceneActive = active === true;
        sceneDocumentVisible =
          documentVisible !== false;

        if (sceneActive && sceneDocumentVisible) {
          scheduleAutoplay();
        } else {
          clearAutoplay();
        }
      },
    ) ?? noop;

  if (!accordionRuntime) {
    scheduleAutoplay();
  }

  const destroy = () => {
    clearAutoplay();
    unsubscribeScene();
    destroyMediaLightbox();
    stageScaler.destroy();
    listenerCleanups.forEach((cleanup) => cleanup());
    tabs.replaceChildren();
    restoreAttribute(tabs, "role", originalTabsRole);

    panels.forEach((panel, panelIndex) => {
      const state = panelStates[panelIndex];

      panel.hidden = state.hidden;
      panel.toggleAttribute("data-moves-awful-active", state.active);
      restoreAttribute(panel, "id", state.id);
      restoreAttribute(panel, "role", state.role);
      restoreAttribute(panel, "aria-hidden", state.ariaHidden);
      restoreAttribute(panel, "aria-labelledby", state.ariaLabelledby);
    });

    if (showcase[INSTANCE]?.destroy === destroy) {
      delete showcase[INSTANCE];
    }
  };

  showcase[INSTANCE] = { destroy };

  return destroy;
}

export function configureMovesAwful(
  root = document,
  { accordionRuntime = null } = {},
) {
  if (!root || typeof root.querySelectorAll !== "function") {
    return noop;
  }

  const destroys = Array.from(
    root.querySelectorAll(MOVES_AWFUL_SELECTOR),
    (showcase, instanceIndex) =>
      createMovesAwfulInstance(
        showcase,
        instanceIndex,
        accordionRuntime,
      ),
  ).filter(Boolean);

  return () => {
    while (destroys.length > 0) {
      destroys.pop()?.();
    }
  };
}
