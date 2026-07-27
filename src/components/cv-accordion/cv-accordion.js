const ACCORDION_DESTROY = Symbol.for("looksawful.cvAccordion.destroy");

const MOBILE_QUERY = "(width <= 50rem)";
const INTRO_END = 0.075;

const noop = () => {};

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function interpolate(from, to, amount) {
  return from + (to - from) * amount;
}

function smoothstep(value) {
  return value * value * (3 - 2 * value);
}

export function computeAccordionFrame({
  progress,
  itemCount,
  initialHeaderSize,
  compactHeaderSize,
  availablePanelSize,
  introEnd = INTRO_END,
}) {
  const safeCount = Math.max(1, Math.trunc(itemCount));

  const normalizedProgress = clamp(progress);

  const introProgress = smoothstep(clamp(normalizedProgress / introEnd));

  const headerSize = interpolate(initialHeaderSize, compactHeaderSize, introProgress);

  const cursor = clamp((normalizedProgress - introEnd) / (1 - introEnd)) * (safeCount - 1);

  const previousIndex = Math.floor(cursor);

  const nextIndex = Math.min(safeCount - 1, previousIndex + 1);

  const transition = smoothstep(cursor - previousIndex);

  const activities = Array.from(
    {
      length: safeCount,
    },
    () => 0,
  );

  activities[previousIndex] += (1 - transition) * introProgress;

  activities[nextIndex] += transition * introProgress;

  return {
    progress: normalizedProgress,
    headerSize,

    availablePanelSize: Math.max(0, availablePanelSize),

    activities,
  };
}

export function createCvAccordion({ root = document, motion } = {}) {
  if (!root || typeof root.querySelector !== "function") {
    return null;
  }

  const scene = root.querySelector("[data-cv-accordion-scene]");

  if (!(scene instanceof HTMLElement)) {
    return null;
  }

  const previousDestroy = scene[ACCORDION_DESTROY];

  if (typeof previousDestroy === "function") {
    previousDestroy();
  }

  const component = scene.querySelector("[data-cv-accordion]");

  const list = scene.querySelector("[data-cv-accordion-list]");

  const items = Array.from(scene.querySelectorAll(".cv-item"));

  const headers = items.map((item) => item.querySelector(".cv-item__header"));

  const panels = items.map((item) => item.querySelector(".cv-item__body"));

  if (
    !(component instanceof HTMLElement) ||
    !(list instanceof HTMLElement) ||
    items.length === 0 ||
    headers.some((header) => !(header instanceof HTMLButtonElement)) ||
    panels.some((panel) => !(panel instanceof HTMLElement))
  ) {
    return null;
  }

  const mobileLayout = window.matchMedia(MOBILE_QUERY);

  const itemCount = items.length;

  const clickHandlers = [];

  const resizeObserver = new ResizeObserver(() => {
    rebuild();
  });

  let animationFrame = 0;
  let geometry = null;
  let destroyed = false;

  /*
   * Без разрешённого motion компонент
   * работает как обычный аккордеон.
   */
  let mode = "click";
  let openIndex = -1;

  function cancelRender() {
    if (!animationFrame) {
      return;
    }

    window.cancelAnimationFrame(animationFrame);

    animationFrame = 0;
  }

  function clearItemStyles() {
    items.forEach((item) => {
      item.style.removeProperty("--head-size");

      item.style.removeProperty("--body-size");

      item.style.removeProperty("--open-progress");
    });

    component.style.removeProperty("--progress");
  }

  function setOpenItem(nextIndex = -1) {
    openIndex = nextIndex;

    items.forEach((item, index) => {
      const isOpen = index === openIndex;

      item.toggleAttribute("data-open", isOpen);

      headers[index].setAttribute("aria-expanded", String(isOpen));

      panels[index].hidden = !isOpen;
    });
  }

  function setClickMode() {
    mode = "click";
    geometry = null;

    cancelRender();
    clearItemStyles();

    scene.dataset.cvAccordionMode = "click";

    scene.removeAttribute("data-cv-accordion-mounted");

    headers.forEach((header) => {
      header.disabled = false;
    });

    /*
     * Все пункты закрыты
     * по умолчанию.
     */
    setOpenItem(-1);
  }

  function setScrollMode() {
    mode = "scroll";
    openIndex = -1;
    geometry = null;

    items.forEach((item, index) => {
      item.removeAttribute("data-open");

      /*
       * В scroll-режиме панели
       * регулируются через CSS-высоту,
       * поэтому hidden нужно убрать.
       */
      panels[index].hidden = false;

      headers[index].disabled = false;

      headers[index].setAttribute("aria-expanded", "false");
    });

    scene.dataset.cvAccordionMode = "scroll";

    scene.dataset.cvAccordionMounted = "true";

    measure();
    render();
  }

  function measure() {
    const listSize = Math.max(1, list.clientHeight);

    const componentSize = Math.max(1, component.getBoundingClientRect().height);

    const initialHeaderSize = listSize / itemCount;

    const isMobile = mobileLayout.matches;

    const desiredCompactSize = clamp(
      listSize * (isMobile ? 0.085 : 0.068),

      isMobile ? 54 : 46,

      isMobile ? 68 : 62,
    );

    const minimumPanelSize = clamp(
      listSize * (isMobile ? 0.24 : 0.34),

      isMobile ? 140 : 220,

      isMobile ? 220 : 420,
    );

    const maximumCompactSize = Math.max(
      42,

      (listSize - minimumPanelSize) / itemCount,
    );

    const compactHeaderSize = Math.min(initialHeaderSize, desiredCompactSize, maximumCompactSize);

    const sceneRect = scene.getBoundingClientRect();

    geometry = {
      initialHeaderSize,
      compactHeaderSize,

      availablePanelSize: Math.max(
        0,

        listSize - compactHeaderSize * itemCount,
      ),

      sceneStart: sceneRect.top + window.scrollY,

      scrollRange: Math.max(
        1,

        scene.offsetHeight - componentSize,
      ),
    };
  }

  function render() {
    animationFrame = 0;

    if (destroyed || mode !== "scroll") {
      return;
    }

    if (!geometry) {
      measure();
    }

    const progress = (window.scrollY - geometry.sceneStart) / geometry.scrollRange;

    const frame = computeAccordionFrame({
      progress,
      itemCount,

      initialHeaderSize: geometry.initialHeaderSize,

      compactHeaderSize: geometry.compactHeaderSize,

      availablePanelSize: geometry.availablePanelSize,
    });

    items.forEach((item, index) => {
      const activity = frame.activities[index];

      item.style.setProperty("--head-size", `${frame.headerSize}px`);

      item.style.setProperty(
        "--body-size",

        `${frame.availablePanelSize * activity}px`,
      );

      item.style.setProperty("--open-progress", activity.toFixed(4));

      headers[index].setAttribute(
        "aria-expanded",

        activity > 0.5 ? "true" : "false",
      );
    });

    component.style.setProperty("--progress", frame.progress.toFixed(4));
  }

  function requestRender() {
    if (animationFrame || destroyed || mode !== "scroll") {
      return;
    }

    animationFrame = window.requestAnimationFrame(render);
  }

  function rebuild() {
    if (destroyed || mode !== "scroll") {
      return;
    }

    geometry = null;

    measure();
    render();
  }

  function syncMotionPreference({ allowed } = {}) {
    if (allowed) {
      setScrollMode();
    } else {
      setClickMode();
    }
  }

  headers.forEach((header, index) => {
    const handleClick = () => {
      /*
       * Reduced-motion режим:
       * обычный аккордеон.
       */
      if (mode === "click") {
        setOpenItem(openIndex === index ? -1 : index);

        return;
      }

      /*
       * Scroll-driven режим:
       * повторный клик по раскрытому
       * пункту возвращает сцену
       * в закрытое начальное состояние.
       */
      if (!geometry) {
        measure();
      }

      const isOpen = header.getAttribute("aria-expanded") === "true";

      const itemProgress = itemCount === 1 ? 0 : index / (itemCount - 1);

      const progress = isOpen ? 0 : INTRO_END + itemProgress * (1 - INTRO_END);

      const target = geometry.sceneStart + progress * geometry.scrollRange;

      window.scrollTo({
        top: target,
        behavior: "smooth",
      });
    };

    clickHandlers.push(handleClick);

    header.addEventListener("click", handleClick);
  });

  window.addEventListener("scroll", requestRender, {
    passive: true,
  });

  window.addEventListener("resize", rebuild);

  window.visualViewport?.addEventListener("resize", rebuild);

  mobileLayout.addEventListener("change", rebuild);

  resizeObserver.observe(component);

  const unsubscribeMotion =
    typeof motion?.subscribe === "function"
      ? motion.subscribe(syncMotionPreference)
      : (() => {
          setClickMode();
          return noop;
        })();

  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      if (!destroyed) {
        rebuild();
      }
    });
  }

  const destroyCvAccordion = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;

    unsubscribeMotion();
    cancelRender();

    resizeObserver.disconnect();

    window.removeEventListener("scroll", requestRender);

    window.removeEventListener("resize", rebuild);

    window.visualViewport?.removeEventListener("resize", rebuild);

    mobileLayout.removeEventListener("change", rebuild);

    headers.forEach((header, index) => {
      header.removeEventListener("click", clickHandlers[index]);

      header.setAttribute("aria-expanded", "false");

      header.disabled = false;

      /*
       * После уничтожения JS
       * возвращаем доступный HTML.
       */
      panels[index].hidden = false;
    });

    items.forEach((item) => {
      item.removeAttribute("data-open");
    });

    scene.removeAttribute("data-cv-accordion-mode");

    scene.removeAttribute("data-cv-accordion-mounted");

    clearItemStyles();

    if (scene[ACCORDION_DESTROY] === destroyCvAccordion) {
      delete scene[ACCORDION_DESTROY];
    }
  };

  scene[ACCORDION_DESTROY] = destroyCvAccordion;

  return destroyCvAccordion;
}
