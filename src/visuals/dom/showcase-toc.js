function setOpen(trigger, panel, value) {
  trigger.setAttribute("aria-expanded", String(value));
  panel.dataset.open = String(value);
}

export function initShowcaseToc(root = document) {
  const toc = root.querySelector("[data-portfolio-toc]");
  if (!(toc instanceof HTMLElement) || toc.dataset.ready === "true") return;
  toc.dataset.ready = "true";

  const trigger = toc.querySelector("[data-portfolio-toc-trigger]");
  const panel = toc.querySelector("[data-portfolio-toc-panel]");
  const links = [...toc.querySelectorAll("[data-portfolio-toc-link]")];

  if (trigger instanceof HTMLButtonElement && panel instanceof HTMLElement) {
    trigger.addEventListener("click", () => {
      setOpen(trigger, panel, panel.dataset.open !== "true");
    });

    links.forEach((link) => {
      link.addEventListener("click", () => setOpen(trigger, panel, false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(trigger, panel, false);
    });
  }

  const targets = links
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const target = id ? document.getElementById(decodeURIComponent(id)) || document.getElementById(id) : null;
      return target ? { link, target } : null;
    })
    .filter(Boolean);

  const activate = (link) => {
    links.forEach((item) => item.classList.toggle("is-active", item === link));
  };

  if ("IntersectionObserver" in window && targets.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (active) {
          const item = targets.find((candidate) => candidate.target === active.target);
          if (item) activate(item.link);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.05, 0.2, 0.4] },
    );

    targets.forEach(({ target }) => observer.observe(target));
  }
}
