function getTargetFromLink(link) {
  const href = link.getAttribute("href");

  if (!href || !href.startsWith("#") || href.length < 2) {
    return null;
  }

  try {
    return document.getElementById(decodeURIComponent(href.slice(1)));
  } catch {
    return null;
  }
}

function setActiveLink(links, activeLink) {
  for (const link of links) {
    link.classList.toggle("is-active", link === activeLink);
  }
}

export function initShowcaseToc(root = document) {
  const toc = root.querySelector("[data-showcase-toc]");

  if (!(toc instanceof HTMLElement)) {
    return;
  }

  const links = Array.from(toc.querySelectorAll('a[href^="#"]')).filter((link) => link instanceof HTMLAnchorElement);
  const pairs = links
    .map((link) => ({ link, target: getTargetFromLink(link) }))
    .filter((pair) => pair.target instanceof HTMLElement);

  if (pairs.length === 0) {
    return;
  }

  const showcase = root.getElementById ? root.getElementById("showcase") : document.getElementById("showcase");

  if (showcase instanceof HTMLElement && "IntersectionObserver" in window) {
    const showcaseObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          toc.classList.toggle("is-visible", entry.isIntersecting);
        }
      },
      { threshold: 0.05 }
    );

    showcaseObserver.observe(showcase);
  } else {
    toc.classList.add("is-visible");
  }

  if (!("IntersectionObserver" in window)) {
    setActiveLink(links, pairs[0].link);
    return;
  }

  const visibleTargets = new Map();

  const targetObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleTargets.set(entry.target, entry.boundingClientRect.top);
        } else {
          visibleTargets.delete(entry.target);
        }
      }

      const visiblePair = pairs
        .filter((pair) => visibleTargets.has(pair.target))
        .sort((a, b) => Math.abs(visibleTargets.get(a.target)) - Math.abs(visibleTargets.get(b.target)))[0];

      if (visiblePair) {
        setActiveLink(links, visiblePair.link);
      }
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: [0, 0.1, 0.4, 0.8]
    }
  );

  for (const pair of pairs) {
    targetObserver.observe(pair.target);
  }
}
