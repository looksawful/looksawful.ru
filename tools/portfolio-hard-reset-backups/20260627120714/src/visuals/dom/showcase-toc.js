const mountedTocs = new WeakSet();

function setOpen(trigger, panel, isOpen) {
  trigger.setAttribute("aria-expanded", String(isOpen));
  panel.dataset.open = String(isOpen);
}

function initToc(root) {
  const toc = root.querySelector("[data-showcase-toc]");

  if (!(toc instanceof HTMLElement) || mountedTocs.has(toc)) {
    return;
  }

  const trigger = toc.querySelector("[data-showcase-toc-trigger]");
  const panel = toc.querySelector("[data-showcase-toc-panel]");
  const links = [...toc.querySelectorAll("[data-showcase-toc-link]")];

  if (!(trigger instanceof HTMLButtonElement) || !(panel instanceof HTMLElement) || !links.length) {
    return;
  }

  mountedTocs.add(toc);
  setOpen(trigger, panel, false);

  trigger.addEventListener("click", () => {
    setOpen(trigger, panel, trigger.getAttribute("aria-expanded") !== "true");
  });

  links.forEach((link) => {
    link.addEventListener("click", () => setOpen(trigger, panel, false));
  });

  const targets = links
    .map((link) => {
      const href = link.getAttribute("href");
      return href && href.startsWith("#") ? document.getElementById(decodeURIComponent(href.slice(1))) : null;
    })
    .filter((target) => target instanceof HTMLElement);

  if (!targets.length || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) {
      return;
    }

    const activeId = visible.target.id;
    links.forEach((link) => {
      const isActive = link.getAttribute("href") === "#" + activeId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }, {
    rootMargin: "-30% 0px -58% 0px",
    threshold: [0, 0.2, 0.45, 0.7]
  });

  targets.forEach((target) => observer.observe(target));
}

export function initShowcaseToc(root = document) {
  initToc(root);
}
