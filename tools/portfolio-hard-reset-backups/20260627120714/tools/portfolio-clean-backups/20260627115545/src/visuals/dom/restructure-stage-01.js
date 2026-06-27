const FRAME_SELECTOR = "[data-jestei-chapter-frame], [data-case-chapter-frame]";
const PROJECT_SELECTOR = "#project-jesteipool, #project-styx, #project-shootings";
const PROTECTED_SELECTOR = "#hero, #resume, .site-header, [data-site-header]";
const TOC_ROOT_SELECTOR = "[data-stage-01-toc-root]";

const directChild = (element, selector) => {
  return Array.from(element.children).find((child) => {
    return child instanceof HTMLElement && child.matches(selector);
  }) || null;
};

const text = (value) => {
  return String(value || "").replace(/\s+/g, " ").trim();
};

const isProtected = (element) => {
  return Boolean(element.closest(PROTECTED_SELECTOR));
};

function getFrameTitle(frame) {
  const fromData = frame.getAttribute("data-jestei-chapter-title") || frame.getAttribute("data-case-chapter-title");
  if (text(fromData)) {
    return text(fromData);
  }

  const title = frame.querySelector(".jestei-chapter-hero__title, .case-chapter-hero__title, h2, h3");
  return text(title?.textContent) || text(frame.id);
}

function getProjectTitle(project) {
  const title = project.querySelector(":scope > .project__header .title, :scope > .project__head .title, h2, h3");
  return text(title?.textContent) || text(project.id.replace(/^project-/, ""));
}

function unpackFrame(frame) {
  if (!(frame instanceof HTMLElement) || isProtected(frame) || frame.dataset.stage01Unpacked === "true") {
    return false;
  }

  const bodyWrap = directChild(frame, ".jestei-chapter-frame__body-wrap, .case-chapter-frame__body-wrap");
  const body = bodyWrap?.querySelector(":scope > .jestei-chapter-frame__body, :scope > .case-chapter-frame__body") || null;
  const control = directChild(frame, ".jestei-chapter-frame__control, .case-chapter-frame__control");

  frame.dataset.stage01Unpacked = "true";
  frame.dataset.expanded = "true";
  frame.dataset.animating = "false";
  frame.classList.add("is-open", "stage-01-unpacked-frame");

  if (control instanceof HTMLElement) {
    control.hidden = true;
    control.setAttribute("aria-hidden", "true");
    control.dataset.stage01Hidden = "true";
  }

  if (!(bodyWrap instanceof HTMLElement) || !(body instanceof HTMLElement)) {
    return true;
  }

  const flow = document.createDocumentFragment();
  Array.from(body.children).forEach((child) => {
    if (!(child instanceof HTMLElement)) {
      return;
    }

    child.classList.add("stage-01-flow-panel");
    child.removeAttribute("aria-hidden");
    flow.appendChild(child);
  });

  frame.insertBefore(flow, bodyWrap.nextSibling);

  bodyWrap.hidden = true;
  bodyWrap.setAttribute("aria-hidden", "true");
  bodyWrap.dataset.stage01Hidden = "true";
  bodyWrap.style.height = "";
  bodyWrap.style.blockSize = "";
  bodyWrap.style.overflow = "";

  return true;
}

function collectTocItems(root) {
  const items = [];

  root.querySelectorAll(PROJECT_SELECTOR).forEach((project) => {
    if (!(project instanceof HTMLElement) || isProtected(project) || !project.id) {
      return;
    }

    items.push({
      id: project.id,
      title: getProjectTitle(project),
      level: 1
    });

    project.querySelectorAll(FRAME_SELECTOR).forEach((frame) => {
      if (!(frame instanceof HTMLElement) || !frame.id || isProtected(frame)) {
        return;
      }

      items.push({
        id: frame.id,
        title: getFrameTitle(frame),
        level: 2
      });
    });
  });

  return items;
}

function createLink(item) {
  const link = document.createElement("a");
  link.className = "stage-01-toc__link";
  link.dataset.stage01TocLink = "";
  link.dataset.stage01TocLevel = String(item.level);
  link.href = "#" + item.id;
  link.textContent = item.title;

  return link;
}

function createTocNav(items, className) {
  const nav = document.createElement("nav");
  nav.className = className;
  nav.setAttribute("aria-label", "содержание кейсов");

  items.forEach((item) => {
    nav.appendChild(createLink(item));
  });

  return nav;
}

function mountToc(root) {
  if (root.querySelector(TOC_ROOT_SELECTOR)) {
    return;
  }

  const screen = root.querySelector("#showcase > .section__screen, .section__screen--showcase");
  const stack = screen?.querySelector(":scope > .showcase-stack");

  if (!(screen instanceof HTMLElement) || !(stack instanceof HTMLElement)) {
    return;
  }

  const items = collectTocItems(root);

  if (items.length < 2) {
    return;
  }

  screen.classList.add("has-stage-01-toc");

  const side = document.createElement("aside");
  side.className = "stage-01-toc";
  side.dataset.stage01TocRoot = "";
  side.innerHTML = '<p class="stage-01-toc__label">содержание</p>';
  side.appendChild(createTocNav(items, "stage-01-toc__nav"));

  const mobile = document.createElement("details");
  mobile.className = "stage-01-mobile-toc";
  mobile.dataset.stage01TocRoot = "";
  mobile.innerHTML = '<summary class="stage-01-mobile-toc__summary">разделы</summary>';
  mobile.appendChild(createTocNav(items, "stage-01-mobile-toc__nav"));

  screen.insertBefore(side, stack);
  screen.insertBefore(mobile, stack);

  initTocActiveState(root, items);
  initMobileTocClose(mobile);
}

function initMobileTocClose(details) {
  details.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => {
      details.open = false;
    });
  });
}

function initTocActiveState(root, items) {
  const links = Array.from(root.querySelectorAll("[data-stage-01-toc-link]"));
  const byId = new Map();

  links.forEach((link) => {
    const id = decodeURIComponent(link.hash || "").replace(/^#/, "");
    if (!id) {
      return;
    }

    const bucket = byId.get(id) || [];
    bucket.push(link);
    byId.set(id, bucket);
  });

  const sections = items
    .map((item) => root.getElementById ? root.getElementById(item.id) : document.getElementById(item.id))
    .filter((section) => section instanceof HTMLElement);

  if (!("IntersectionObserver" in window) || sections.length === 0) {
    return;
  }

  let activeId = "";

  const setActive = (id) => {
    if (!id || activeId === id) {
      return;
    }

    activeId = id;
    links.forEach((link) => {
      const linkId = decodeURIComponent(link.hash || "").replace(/^#/, "");
      link.classList.toggle("is-active", linkId === id);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];

    if (visible?.target?.id) {
      setActive(visible.target.id);
    }
  }, {
    root: null,
    rootMargin: "-22% 0px -66% 0px",
    threshold: [0, 0.01, 0.1]
  });

  sections.forEach((section) => observer.observe(section));
}

function unpackFrames(root) {
  let count = 0;

  root.querySelectorAll(FRAME_SELECTOR).forEach((frame) => {
    if (unpackFrame(frame)) {
      count += 1;
    }
  });

  return count;
}

export function initRestructureStage01(root = document) {
  const count = unpackFrames(root);
  mountToc(root);

  if (count > 0) {
    document.documentElement.classList.add("has-stage-01-unpacked");
    document.documentElement.dataset.stage01Unpacked = "true";
  }

  return { unpackedFrames: count };
}
