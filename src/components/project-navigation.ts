const noop = () => {};

export interface ProjectNavigationViewportGeometry {
  viewportTop: number;
  viewportHeight: number;
  naturalNavigationTop: number;
  navigationHeight: number;
  sectionTop: number;
  sectionBottom: number;
}

export function calculateProjectNavigationViewportOffset({
  viewportTop,
  viewportHeight,
  naturalNavigationTop,
  navigationHeight,
  sectionTop,
  sectionBottom,
}: ProjectNavigationViewportGeometry): number {
  const viewportBottom = viewportTop + Math.max(0, viewportHeight);
  const safeNavigationHeight = Math.max(0, navigationHeight);
  const sectionNavigationEnd = Math.max(
    sectionTop,
    sectionBottom - safeNavigationHeight,
  );
  const desiredTop = viewportBottom - safeNavigationHeight;
  const targetTop = Math.min(
    Math.max(desiredTop, sectionTop),
    sectionNavigationEnd,
  );

  return Math.max(0, targetTop - naturalNavigationTop);
}

export function initProjectNavigationViewportAnchor(
  root: Document | HTMLElement = document,
): () => void {
  const navigation = root.querySelector<HTMLElement>("[data-projects-navigation]");
  if (!(navigation instanceof HTMLElement)) return noop;

  const projects = navigation.closest<HTMLElement>(".projects");
  if (!(projects instanceof HTMLElement)) return noop;

  const view = navigation.ownerDocument.defaultView;
  const visualViewport = view?.visualViewport;
  if (!view || !visualViewport) return noop;

  const narrowLayout = view.matchMedia("(max-width: 96rem)");
  let currentOffset = 0;
  let frame = 0;

  const clearAnchor = (): void => {
    currentOffset = 0;
    navigation.removeAttribute("data-viewport-anchor");
    navigation.style.removeProperty("--project-nav-viewport-offset");
  };

  const render = (): void => {
    if (!narrowLayout.matches) {
      clearAnchor();
      return;
    }

    if (!navigation.hasAttribute("data-viewport-anchor")) {
      currentOffset = 0;
      navigation.setAttribute("data-viewport-anchor", "");
      navigation.style.setProperty("--project-nav-viewport-offset", "0px");
    }

    const navigationRect = navigation.getBoundingClientRect();
    const projectsRect = projects.getBoundingClientRect();
    const naturalNavigationTop = navigationRect.top - currentOffset;
    const nextOffset = calculateProjectNavigationViewportOffset({
      viewportTop: Math.max(0, visualViewport.offsetTop),
      viewportHeight: visualViewport.height,
      naturalNavigationTop,
      navigationHeight: navigationRect.height,
      sectionTop: projectsRect.top,
      sectionBottom: projectsRect.bottom,
    });

    currentOffset = nextOffset;
    navigation.style.setProperty(
      "--project-nav-viewport-offset",
      `${nextOffset}px`,
    );
  };

  const schedule = (): void => {
    if (frame) return;

    frame = view.requestAnimationFrame(() => {
      frame = 0;
      render();
    });
  };

  view.addEventListener("scroll", schedule, { passive: true });
  view.addEventListener("resize", schedule, { passive: true });
  visualViewport.addEventListener("scroll", schedule, { passive: true });
  visualViewport.addEventListener("resize", schedule, { passive: true });
  narrowLayout.addEventListener("change", schedule);

  render();

  return () => {
    if (frame) view.cancelAnimationFrame(frame);
    view.removeEventListener("scroll", schedule);
    view.removeEventListener("resize", schedule);
    visualViewport.removeEventListener("scroll", schedule);
    visualViewport.removeEventListener("resize", schedule);
    narrowLayout.removeEventListener("change", schedule);
    clearAnchor();
  };
}

export function initProjectNavigationBackToTop(
  root: Document | HTMLElement = document,
): () => void {
  const navigation = root.querySelector<HTMLElement>("[data-projects-navigation]");
  if (!(navigation instanceof HTMLElement)) return noop;

  const inner = navigation.querySelector<HTMLElement>(".project-nav__inner");
  if (!(inner instanceof HTMLElement) || inner.querySelector(".project-nav__top")) {
    return noop;
  }

  const hero = root.querySelector<HTMLElement>(".hero");
  if (!(hero instanceof HTMLElement)) return noop;

  const doc = hero.ownerDocument;
  let targetId = hero.id;
  let assignedTopId = false;

  if (!targetId) {
    const existingTop = doc.getElementById("top");

    if (existingTop instanceof HTMLElement) {
      targetId = "top";
    } else {
      targetId = "top";
      hero.id = targetId;
      assignedTopId = true;
    }
  }

  const link = doc.createElement("a");
  link.className = "project-nav__top";
  link.setAttribute("href", `#${targetId}`);
  link.setAttribute("aria-label", "Наверх");

  const arrow = doc.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.textContent = "↑";

  const label = doc.createElement("span");
  label.className = "project-nav__top-label";
  label.textContent = "Наверх";

  link.append(arrow, label);
  inner.append(link);

  return () => {
    link.remove();

    if (assignedTopId && hero.id === "top") {
      hero.removeAttribute("id");
    }
  };
}

function supportsNativeProjectNavigation(): boolean {
  return (
    typeof CSS !== "undefined"
    && CSS.supports("scroll-target-group: auto")
    && CSS.supports("selector(:target-current)")
  );
}

export function initProjectNavigationFallback(
  root: Document | HTMLElement = document,
): () => void {
  if (
    supportsNativeProjectNavigation()
    || typeof IntersectionObserver !== "function"
  ) {
    return noop;
  }

  const navigation = root.querySelector<HTMLElement>("[data-projects-navigation]");
  if (!(navigation instanceof HTMLElement)) return noop;

  const list = navigation.querySelector<HTMLElement>(".project-nav__list");
  if (!(list instanceof HTMLElement)) return noop;

  const entries = [...navigation.querySelectorAll<HTMLAnchorElement>('.project-nav__link[href^="#"]')]
    .map((link) => {
      if (!(link instanceof HTMLAnchorElement) || !link.hash) return null;

      const id = decodeURIComponent(link.hash.slice(1));
      const target = link.ownerDocument.getElementById(id);

      return target instanceof HTMLElement && !target.hidden
        ? { link, target }
        : null;
    })
    .filter((entry): entry is { link: HTMLAnchorElement; target: HTMLElement } => entry !== null);

  if (!entries.length) return noop;

  const linkByTarget = new Map(entries.map(({ link, target }) => [target, link]));
  let currentTarget: HTMLElement | null = null;

  const centerActiveLink = (link: HTMLAnchorElement): void => {
    if (list.scrollWidth <= list.clientWidth + 1) return;

    const listRect = list.getBoundingClientRect();
    const linkRect = link.getBoundingClientRect();
    const left = Math.max(
      0,
      list.scrollLeft
        + (linkRect.left - listRect.left)
        - (list.clientWidth - linkRect.width) / 2,
    );

    list.scrollTo({ left, behavior: "auto" });
  };

  const setCurrent = (target: HTMLElement): void => {
    if (target === currentTarget) return;

    currentTarget = target;

    for (const { link, target: entryTarget } of entries) {
      if (entryTarget === target) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    }

    const activeLink = linkByTarget.get(target);
    if (activeLink) centerActiveLink(activeLink);
  };

  const observer = new IntersectionObserver(
    (observedEntries) => {
      const activeEntry = observedEntries.find(
        (entry) => entry.isIntersecting && entry.target instanceof HTMLElement,
      );

      if (activeEntry?.target instanceof HTMLElement) {
        setCurrent(activeEntry.target);
      }
    },
    {
      root: null,
      rootMargin: "-20% 0px -79% 0px",
      threshold: 0,
    },
  );

  entries.forEach(({ target }) => observer.observe(target));

  return () => {
    observer.disconnect();
    entries.forEach(({ link }) => link.removeAttribute("aria-current"));
  };
}