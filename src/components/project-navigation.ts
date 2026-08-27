const noop = () => {};

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