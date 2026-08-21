const noop = () => {};
const animationMinInlineSize = () => {
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return 48 * rootFontSize;
};

function cloneItem(item) {
  const clone = item.cloneNode(true);
  clone.setAttribute("data-infinite-reel-clone", "");
  clone.setAttribute("aria-hidden", "true");

  clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  clone.querySelectorAll("img").forEach((image) => {
    image.loading = "eager";
  });

  return clone;
}

export function createInfiniteReel(root, { motion } = {}) {
  if (!(root instanceof HTMLElement)) return noop;
  const track = root.querySelector(":scope > [data-infinite-reel-track]");
  if (!(track instanceof HTMLElement)) return noop;

  let destroyed = false;
  let allowed = motion?.allowsMotion?.() ?? true;
  let wideEnough = root.getBoundingClientRect().width > animationMinInlineSize();

  const removeClones = () => {
    track.querySelectorAll("[data-infinite-reel-clone]").forEach((clone) => clone.remove());
    root.removeAttribute("data-animated");
  };

  const refresh = () => {
    removeClones();
    if (destroyed || !allowed || !wideEnough) return;

    const items = [...track.children].filter(
      (item) => item instanceof HTMLElement && !item.hasAttribute("data-infinite-reel-clone"),
    );
    if (!items.length) return;

    const fragment = document.createDocumentFragment();
    items.forEach((item) => fragment.append(cloneItem(item)));
    track.append(fragment);
    root.setAttribute("data-animated", "true");
  };

  const unsubscribe =
    motion?.subscribe?.(({ allowed: nextAllowed }) => {
      allowed = Boolean(nextAllowed);
      refresh();
    }) ?? noop;

  const resizeObserver =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(([entry]) => {
          const nextWideEnough = entry.contentRect.width > animationMinInlineSize();
          if (nextWideEnough === wideEnough) return;
          wideEnough = nextWideEnough;
          refresh();
        })
      : null;

  resizeObserver?.observe(root);

  if (!motion?.subscribe) refresh();
  else if (!allowed || !wideEnough) removeClones();

  return () => {
    destroyed = true;
    resizeObserver?.disconnect();
    unsubscribe();
    removeClones();
  };
}

export function createInfiniteReels({ root = document, motion } = {}) {
  const destroys = [...root.querySelectorAll("[data-infinite-reel]")]
    .map((element) => createInfiniteReel(element, { motion }))
    .filter(Boolean);
  return () => destroys.splice(0).reverse().forEach((destroy) => destroy?.());
}
