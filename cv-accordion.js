const ACCORDION_DESTROY = Symbol.for("looksawful.cvAccordion.destroy");
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MOBILE_QUERY = "(width <= 50rem)";
const INTRO_END = 0.075;

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
  const headerSize = interpolate(
    initialHeaderSize,
    compactHeaderSize,
    introProgress,
  );
  const cursor =
    clamp((normalizedProgress - introEnd) / (1 - introEnd)) *
    (safeCount - 1);
  const previousIndex = Math.floor(cursor);
  const nextIndex = Math.min(safeCount - 1, previousIndex + 1);
  const transition = smoothstep(cursor - previousIndex);
  const activities = Array.from({ length: safeCount }, () => 0);

  activities[previousIndex] += (1 - transition) * introProgress;
  activities[nextIndex] += transition * introProgress;

  return {
    progress: normalizedProgress,
    headerSize,
    availablePanelSize: Math.max(0, availablePanelSize),
    activities,
  };
}

export function createCvAccordion(root = document) {
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

  if (
    !(component instanceof HTMLElement) ||
    !(list instanceof HTMLElement) ||
    items.length === 0 ||
    headers.some((header) => !(header instanceof HTMLButtonElement))
  ) {
    return null;
  }

  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  const mobileLayout = window.matchMedia(MOBILE_QUERY);
  const itemCount = items.length;
  const clickHandlers = [];
  const resizeObserver = new ResizeObserver(() => rebuild());

  let animationFrame = 0;
  let geometry = null;
  let destroyed = false;

  function clearItemStyles() {
    items.forEach((item) => {
      item.style.removeProperty("--head-size");
      item.style.removeProperty("--body-size");
      item.style.removeProperty("--open-progress");
    });

    component.style.removeProperty("--progress");
  }

  function setStaticMode() {
    scene.removeAttribute("data-cv-accordion-mounted");
    clearItemStyles();

    headers.forEach((header) => {
      header.setAttribute("aria-expanded", "true");
      header.disabled = true;
    });
  }

  function measure() {
    const listSize = Math.max(1, list.clientHeight);
    const componentSize = Math.max(
      1,
      component.getBoundingClientRect().height,
    );
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
    const compactHeaderSize = Math.min(
      initialHeaderSize,
      desiredCompactSize,
      maximumCompactSize,
    );
    const sceneRect = scene.getBoundingClientRect();

    geometry = {
      initialHeaderSize,
      compactHeaderSize,
      availablePanelSize: Math.max(
        0,
        listSize - compactHeaderSize * itemCount,
      ),
      sceneStart: sceneRect.top + window.scrollY,
      scrollRange: Math.max(1, scene.offsetHeight - componentSize),
    };
  }

  function render() {
    animationFrame = 0;

    if (destroyed || reducedMotion.matches) {
      return;
    }

    if (!geometry) {
      measure();
    }

    const progress =
      (window.scrollY - geometry.sceneStart) / geometry.scrollRange;
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
      headers[index].disabled = false;
    });

    component.style.setProperty("--progress", frame.progress.toFixed(4));
  }

  function requestRender() {
    if (animationFrame || destroyed) {
      return;
    }

    animationFrame = window.requestAnimationFrame(render);
  }

  function rebuild() {
    if (destroyed) {
      return;
    }

    geometry = null;

    if (reducedMotion.matches) {
      setStaticMode();
      return;
    }

    scene.dataset.cvAccordionMounted = "true";
    measure();
    render();
  }

  function handleMotionPreference() {
    rebuild();
  }

  headers.forEach((header, index) => {
    const handleClick = () => {
      if (reducedMotion.matches) {
        return;
      }

      if (!geometry) {
        measure();
      }

      const itemProgress = itemCount === 1 ? 0 : index / (itemCount - 1);
      const progress = INTRO_END + itemProgress * (1 - INTRO_END);
      const target = geometry.sceneStart + progress * geometry.scrollRange;

      window.scrollTo({
        top: target,
        behavior: "smooth",
      });
    };

    clickHandlers.push(handleClick);
    header.addEventListener("click", handleClick);
  });

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", rebuild);
  window.visualViewport?.addEventListener("resize", rebuild);
  reducedMotion.addEventListener("change", handleMotionPreference);
  mobileLayout.addEventListener("change", rebuild);
  resizeObserver.observe(component);

  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => {
      if (!destroyed) {
        rebuild();
      }
    });
  }

  rebuild();

  const destroyCvAccordion = () => {
    if (destroyed) {
      return;
    }

    destroyed = true;

    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
    }

    resizeObserver.disconnect();
    window.removeEventListener("scroll", requestRender);
    window.removeEventListener("resize", rebuild);
    window.visualViewport?.removeEventListener("resize", rebuild);
    reducedMotion.removeEventListener("change", handleMotionPreference);
    mobileLayout.removeEventListener("change", rebuild);

    headers.forEach((header, index) => {
      header.removeEventListener("click", clickHandlers[index]);
      header.setAttribute("aria-expanded", "false");
      header.disabled = false;
    });

    scene.removeAttribute("data-cv-accordion-mounted");
    clearItemStyles();

    if (scene[ACCORDION_DESTROY] === destroyCvAccordion) {
      delete scene[ACCORDION_DESTROY];
    }
  };

  scene[ACCORDION_DESTROY] = destroyCvAccordion;
  return destroyCvAccordion;
}
