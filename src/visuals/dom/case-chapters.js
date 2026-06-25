const mountedChapters = new WeakSet();
const mountedJesteiFrames = new WeakSet();

function syncChapter(chapter) {
  const isOpen = chapter.classList.contains("is-open");
  const toggle = chapter.querySelector("[data-case-chapter-toggle]");

  chapter.classList.toggle("is-compact", !isOpen);

  if (!toggle) {
    return;
  }

  const openLabel = toggle.getAttribute("data-open-label") || "раскрыть детали";
  const closeLabel = toggle.getAttribute("data-close-label") || "свернуть детали";

  toggle.setAttribute("aria-expanded", String(isOpen));
  toggle.textContent = isOpen ? closeLabel : openLabel;
}

function preserveScroll(target, callback) {
  const before = target.getBoundingClientRect().top;
  callback();
  const after = target.getBoundingClientRect().top;
  window.scrollBy(0, after - before);
}

function getFrameParts(frame) {
  return {
    wrap: frame.querySelector(".jestei-chapter-frame__body-wrap"),
    body: frame.querySelector(".jestei-chapter-frame__body")
  };
}

function getFrameHeight(body) {
  if (!(body instanceof HTMLElement)) {
    return 0;
  }

  return body.offsetHeight;
}

function animateHeight(element, from, to, options) {
  const gsap = window.gsap;

  if (gsap) {
    gsap.killTweensOf(element);
    gsap.fromTo(
      element,
      { height: from },
      {
        height: to,
        duration: options.duration,
        ease: options.ease,
        onComplete: options.onComplete
      }
    );
    return;
  }

  element.style.height = String(to) + "px";
  window.setTimeout(options.onComplete, options.duration * 1000);
}

function expandJesteiFrame(frame) {
  if (frame.dataset.expanded === "true" || frame.dataset.animating === "true") {
    return;
  }

  const parts = getFrameParts(frame);

  if (!(parts.wrap instanceof HTMLElement) || !(parts.body instanceof HTMLElement)) {
    return;
  }

  frame.dataset.expanded = "true";
  frame.dataset.animating = "true";
  parts.wrap.setAttribute("aria-hidden", "false");

  const targetHeight = getFrameHeight(parts.body);

  animateHeight(parts.wrap, 0, targetHeight, {
    duration: 0.9,
    ease: "power3.inOut",
    onComplete: () => {
      parts.wrap.style.height = "auto";
      frame.dataset.animating = "false";
    }
  });
}

function initJesteiChapterFrames(root) {
  const frames = Array.from(root.querySelectorAll("[data-jestei-chapter-frame]"));

  if (frames.length === 0) {
    return;
  }

  for (const frame of frames) {
    if (!(frame instanceof HTMLElement) || mountedJesteiFrames.has(frame)) {
      continue;
    }

    mountedJesteiFrames.add(frame);
    frame.dataset.expanded = "false";
    frame.dataset.animating = "false";
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!(entry.target instanceof HTMLElement)) {
            continue;
          }

          if (entry.isIntersecting) {
            expandJesteiFrame(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },
      {
        rootMargin: "-12% 0px -24% 0px",
        threshold: 0.28
      }
    );

    for (const frame of frames) {
      if (frame instanceof HTMLElement) {
        observer.observe(frame);
      }
    }

    return;
  }

  for (const frame of frames) {
    if (frame instanceof HTMLElement) {
      expandJesteiFrame(frame);
    }
  }
}

export function initCaseChapters(root = document) {
  root.querySelectorAll("[data-case-chapter]").forEach((chapter) => {
    if (!(chapter instanceof HTMLElement) || mountedChapters.has(chapter)) {
      return;
    }

    mountedChapters.add(chapter);
    syncChapter(chapter);

    const toggle = chapter.querySelector("[data-case-chapter-toggle]");

    if (!(toggle instanceof HTMLButtonElement)) {
      return;
    }

    toggle.addEventListener("click", () => {
      preserveScroll(chapter, () => {
        const nextOpen = !chapter.classList.contains("is-open");
        chapter.classList.toggle("is-open", nextOpen);
        chapter.classList.toggle("is-compact", !nextOpen);
        syncChapter(chapter);
      });
    });
  });

  initJesteiChapterFrames(root);
}
