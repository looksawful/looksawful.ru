const SCENE_SELECTOR = "#jestei-process-scene";
const CARD_SELECTOR = "#jestei-results .jestei-bento__card--manual";

function createProcessVisual(card) {
  const doc = card.ownerDocument;
  const visual = doc.createElement("div");
  visual.className = "jestei-bento__process-visual";
  visual.setAttribute("aria-hidden", "true");
  visual.innerHTML = `
    <svg class="jestei-bento__process-svg" id="jestei-process-scene" viewBox="18 140 848 550" preserveAspectRatio="xMidYMid meet" focusable="false">
      <defs id="jestei-process-defs">
        <filter id="jestei-process-shadow-black" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity=".10"></feDropShadow>
        </filter>
        <filter id="jestei-process-shadow-purple" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#5031ff" flood-opacity=".08"></feDropShadow>
        </filter>
      </defs>
      <g id="jestei-process-wire-layer"></g>
      <g id="jestei-process-shape-layer"></g>
      <g id="jestei-process-port-layer"></g>
      <g id="jestei-process-dot-layer"></g>
    </svg>
  `;
  card.append(visual);
  return visual.querySelector(SCENE_SELECTOR);
}

function initializeScene(svg) {
  if (!svg || svg.namespaceURI !== "http://www.w3.org/2000/svg" || svg.dataset.processMounted === "true") return;
  svg.dataset.processMounted = "true";

  const doc = svg.ownerDocument;
  const win = doc.defaultView || window;
  const NS = "http://www.w3.org/2000/svg";
  const defs = svg.querySelector("#jestei-process-defs");
  const wireLayer = svg.querySelector("#jestei-process-wire-layer");
  const shapeLayer = svg.querySelector("#jestei-process-shape-layer");
  const portLayer = svg.querySelector("#jestei-process-port-layer");
  const dotLayer = svg.querySelector("#jestei-process-dot-layer");
  if (!defs || !wireLayer || !shapeLayer || !portLayer || !dotLayer) return;

  const reducedMotion = win.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const staticMode = new URLSearchParams(win.location.search).has("static") || reducedMotion;
  const DRAW = 7600;
  const HOLD = 250;
  const ERASE = 7600;
  const CYCLE = DRAW + HOLD + ERASE;
  const SPEED = 1.012;
  const START_OFFSET = 2600;
  const items = [];
  const ports = [];

  function el(name, attrs, parent) {
    const node = doc.createElementNS(NS, name);
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (value != null) node.setAttribute(key, value);
      }
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  function rr(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    const x2 = x + w;
    const y2 = y + h;
    return `M ${x + radius} ${y} H ${x2 - radius} Q ${x2} ${y} ${x2} ${y + radius} V ${y2 - radius} Q ${x2} ${y2} ${x2 - radius} ${y2} H ${x + radius} Q ${x} ${y2} ${x} ${y2 - radius} V ${y + radius} Q ${x} ${y} ${x + radius} ${y} Z`;
  }

  function rrTop(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    const x2 = x + w;
    const cy = y + h / 2;
    return `M ${x} ${cy} V ${y + radius} Q ${x} ${y} ${x + radius} ${y} H ${x2 - radius} Q ${x2} ${y} ${x2} ${y + radius} V ${cy}`;
  }

  function rrBottom(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    const x2 = x + w;
    const y2 = y + h;
    const cy = y + h / 2;
    return `M ${x} ${cy} V ${y2 - radius} Q ${x} ${y2} ${x + radius} ${y2} H ${x2 - radius} Q ${x2} ${y2} ${x2} ${y2 - radius} V ${cy}`;
  }

  function add(id, d, type, dashed, layer, start, end, shadow) {
    const path = el("path", {
      id: `jestei-process-${id}`,
      d,
      class: `jestei-process__stroke jestei-process__${type}${dashed ? " jestei-process__dashed" : ""}`,
      filter: shadow ? `url(#jestei-process-${shadow})` : null,
    }, layer);
    items.push({ id, path, type, start, end });
    return path;
  }

  add("lead", "M 30 264 H 71", "black", false, wireLayer, 0, 420, null);
  add("b1", rr(71, 203, 59, 122, 9), "black", false, shapeLayer, 420, 980, "shadow-black");
  add("bw1", "M130 237 C170 237 169 197 223 197", "black", false, wireLayer, 980, 1570, null);
  add("bw2", "M130 263 C174 263 173 313 223 313", "black", false, wireLayer, 980, 1570, null);
  add("bw3", "M130 289 C157 289 160 305 160 326 L160 379 C160 400 172 410 194 410", "black", false, wireLayer, 980, 1680, null);
  add("b2", rr(223, 159, 106, 73, 11), "black", false, shapeLayer, 1570, 2220, "shadow-black");
  add("b3", rr(223, 278, 96, 70, 10), "black", false, shapeLayer, 1570, 2220, "shadow-black");
  add("b4", rr(194, 377, 87, 64, 10), "black", false, shapeLayer, 1680, 2300, "shadow-black");
  add("bw4", "M329 190 C369 190 344 233 384 233", "black", false, wireLayer, 2220, 2810, null);
  add("bw5", "M319 313 C350 313 352 284 384 284", "black", false, wireLayer, 2220, 2810, null);
  add("bw6", "M281 410 C342 410 329 324 384 324", "black", false, wireLayer, 2300, 2900, null);
  add("b5", rr(384, 209, 103, 149, 10), "black", false, shapeLayer, 2900, 3700, "shadow-black");
  add("bw13", "M437 358 C437 375 430 376 430 394", "black", false, wireLayer, 3300, 3750, null);
  add("b9", rr(355, 394, 151, 66, 10), "black", false, shapeLayer, 3750, 4420, "shadow-black");
  add("bw7", "M487 257 C519 257 516 234 547 234", "black", false, wireLayer, 3700, 4260, null);
  add("bw8", "M487 294 C523 294 516 332 553 332", "black", false, wireLayer, 3700, 4260, null);
  add("bw9", "M487 331 C528 331 510 416 570 416", "black", false, wireLayer, 3700, 4350, null);
  add("b6", rr(547, 201, 94, 71, 10), "black", false, shapeLayer, 4260, 4900, "shadow-black");
  add("b7", rr(553, 304, 66, 60, 9), "black", false, shapeLayer, 4260, 4860, "shadow-black");
  add("b8", rr(570, 385, 93, 64, 10), "black", false, shapeLayer, 4350, 4990, "shadow-black");
  add("bw10", "M641 234 C671 234 652 283 672 283", "black", false, wireLayer, 4900, 5420, null);
  add("bw11", "M619 332 C645 332 647 320 672 320", "black", false, wireLayer, 4860, 5380, null);
  add("bw12", "M663 416 C704 416 713 379 713 358", "black", false, wireLayer, 4990, 5580, null);
  add("b10", rr(672, 259, 82, 99, 9), "black", false, shapeLayer, 5580, 6250, "shadow-black");
  add("bw14", "M754 290 C771 290 773 274 787 274", "black", false, wireLayer, 6250, 6670, null);
  add("bw15", "M754 338 C771 338 775 345 787 345", "black", false, wireLayer, 6250, 6670, null);
  add("b11", rr(787, 252, 45, 44, 8), "black", false, shapeLayer, 6670, 7130, "shadow-black");
  add("b12", rr(787, 323, 45, 44, 8), "black", false, shapeLayer, 6670, 7130, "shadow-black");
  add("exit", "M832 274 H850 M832 345 H850", "black", false, wireLayer, 7130, 7500, null);

  add("pw0", "M30 570 H70", "purple", true, wireLayer, 0, 500, null);
  add("p4t", rrTop(70, 500, 82, 140, 14), "purple", true, shapeLayer, 500, 1500, null);
  add("p4b", rrBottom(70, 500, 82, 140, 14), "purple", true, shapeLayer, 500, 1500, null);
  add("pw1", "M152 570 C180 570 180 633 210 633", "purple", true, wireLayer, 1500, 1900, null);
  add("p1t", rrTop(210, 595, 132, 76, 14), "purple", true, shapeLayer, 1900, 2800, null);
  add("p1b", rrBottom(210, 595, 132, 76, 14), "purple", true, shapeLayer, 1900, 2800, null);
  add("pw2", "M342 633 C378 633 374 560 410 560", "purple", true, wireLayer, 2800, 3250, null);
  add("p3t", rrTop(410, 490, 170, 140, 16), "purple", true, shapeLayer, 3250, 4450, null);
  add("p3b", rrBottom(410, 490, 170, 140, 16), "purple", true, shapeLayer, 3250, 4450, null);
  add("pw3", "M580 560 C610 560 610 638 640 638", "purple", true, wireLayer, 4450, 4900, null);
  add("p5t", rrTop(640, 600, 122, 76, 14), "purple", true, shapeLayer, 4900, 5800, null);
  add("p5b", rrBottom(640, 600, 122, 76, 14), "purple", true, shapeLayer, 4900, 5800, null);
  add("pw4", "M762 638 C784 638 784 578 800 578", "purple", true, wireLayer, 5800, 6200, null);
  add("p6t", rrTop(800, 515, 52, 126, 14), "purple", true, shapeLayer, 6200, 6900, null);
  add("p6b", rrBottom(800, 515, 52, 126, 14), "purple", true, shapeLayer, 6200, 6900, null);
  add("pw5", "M852 578 H866", "purple", true, wireLayer, 6900, 7300, null);

  const portData = [
    [130, 237, 980], [130, 263, 980], [130, 289, 980],
    [223, 177, 1570], [223, 197, 1570], [329, 190, 2220],
    [223, 313, 1570], [319, 313, 2220], [194, 410, 1680], [281, 410, 2300],
    [384, 233, 2900], [384, 284, 2900], [384, 324, 2900],
    [487, 257, 3700], [487, 294, 3700], [487, 331, 3700], [437, 358, 3300],
    [547, 234, 4260], [641, 234, 4900], [553, 332, 4260], [619, 332, 4860],
    [570, 416, 4350], [663, 416, 4990], [430, 394, 3750],
    [672, 283, 5580], [672, 320, 5580], [754, 290, 6250], [754, 338, 6250], [713, 358, 5580],
    [787, 274, 6670], [787, 345, 6670],
  ];

  for (const [x, y, at] of portData) {
    const circle = el("circle", { cx: x, cy: y, r: 4.15, class: "jestei-process__port" }, portLayer);
    ports.push({ node: circle, at });
  }

  const blackDots = Array.from({ length: 3 }, () => el("circle", {
    r: 3.5,
    class: "jestei-process__dot jestei-process__black-dot",
  }, dotLayer));
  const purpleDots = Array.from({ length: 2 }, () => el("circle", {
    r: 3.5,
    class: "jestei-process__dot jestei-process__purple-dot",
  }, dotLayer));

  function buildMask(item) {
    const length = item.path.getTotalLength();
    item.len = length;
    if (staticMode) return;

    const maskId = `jestei-process-mask-${item.id}`;
    const mask = el("mask", { id: maskId, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 880, height: 720 }, defs);
    el("rect", { x: 0, y: 0, width: 880, height: 720, fill: "#000" }, mask);
    const reveal = el("path", {
      d: item.path.getAttribute("d"),
      fill: "none",
      stroke: "#fff",
      "stroke-width": 5,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }, mask);

    reveal.style.strokeDasharray = String(length);
    reveal.style.strokeDashoffset = String(length);
    item.reveal = reveal;
    item.path.setAttribute("mask", `url(#${maskId})`);
  }

  items.forEach(buildMask);

  if (staticMode) {
    ports.forEach(({ node }) => { node.style.opacity = "1"; });
    return;
  }

  function progress(time, start, end) {
    if (time <= start) return 0;
    if (time >= end) return 1;
    return (time - start) / (end - start);
  }

  function setMaskDraw(item, value) {
    const visible = Math.max(0, Math.min(item.len, item.len * value));
    item.reveal.style.strokeDasharray = `${visible} ${item.len}`;
    item.reveal.style.strokeDashoffset = "0";
  }

  function setMaskErase(item, value) {
    const hidden = Math.max(0, Math.min(item.len, item.len * value));
    const visible = Math.max(0, item.len - hidden);
    item.reveal.style.strokeDasharray = `${visible} ${item.len}`;
    item.reveal.style.strokeDashoffset = String(-hidden);
  }

  function pointOn(item, value) {
    return item.path.getPointAtLength(item.len * Math.max(0, Math.min(1, value)));
  }

  function positionDots(activeItems, dots) {
    for (let index = 0; index < dots.length; index += 1) {
      const current = activeItems[index];
      if (!current) {
        dots[index].style.opacity = "0";
        continue;
      }
      const point = pointOn(current.item, current.progress);
      dots[index].setAttribute("cx", point.x);
      dots[index].setAttribute("cy", point.y);
      dots[index].style.opacity = "1";
    }
  }

  function updateDraw(time) {
    const activeBlack = [];
    const activePurple = [];
    for (const item of items) {
      const value = progress(time, item.start, item.end);
      setMaskDraw(item, value);
      if (value > 0 && value < 1) {
        (item.type === "black" ? activeBlack : activePurple).push({ item, progress: value });
      }
    }
    positionDots(activeBlack, blackDots);
    positionDots(activePurple, purpleDots);
    ports.forEach(({ node, at }) => { node.style.opacity = time >= at ? "1" : "0"; });
  }

  function updateErase(time) {
    const activeBlack = [];
    const activePurple = [];
    for (const item of items) {
      const value = progress(time, item.start, item.end);
      setMaskErase(item, value);
      if (value > 0 && value < 1) {
        (item.type === "black" ? activeBlack : activePurple).push({ item, progress: value });
      }
    }
    positionDots(activeBlack, blackDots);
    positionDots(activePurple, purpleDots);
    ports.forEach(({ node, at }) => { node.style.opacity = time < at ? "1" : "0"; });
  }

  let startTime = null;
  let raf = 0;
  let active = false;
  let viewportSyncRaf = 0;

  function frame(now) {
    if (!active) return;
    if (startTime == null) startTime = now - START_OFFSET / SPEED;
    const time = ((now - startTime) * SPEED) % CYCLE;

    if (time < DRAW) {
      updateDraw(time);
    } else if (time < DRAW + HOLD) {
      updateDraw(DRAW);
      blackDots.forEach((dot) => { dot.style.opacity = "0"; });
      purpleDots.forEach((dot) => { dot.style.opacity = "0"; });
    } else {
      updateErase(time - DRAW - HOLD);
    }

    raf = win.requestAnimationFrame(frame);
  }

  function isSceneInViewport() {
    const rect = svg.getBoundingClientRect();
    const margin = Math.max(80, win.innerHeight * 0.18);
    return rect.bottom > -margin && rect.top < win.innerHeight + margin && rect.width > 0 && rect.height > 0;
  }

  function syncActiveFromViewport() {
    viewportSyncRaf = 0;
    setActive(isSceneInViewport());
  }

  function queueViewportSync() {
    if (viewportSyncRaf) return;
    viewportSyncRaf = win.requestAnimationFrame(syncActiveFromViewport);
  }

  function setActive(nextActive) {
    if (active === nextActive) return;
    active = nextActive;
    if (active) {
      startTime = null;
      win.cancelAnimationFrame(raf);
      raf = win.requestAnimationFrame(frame);
    } else {
      win.cancelAnimationFrame(raf);
    }
  }

  if ("IntersectionObserver" in win) {
    const observer = new win.IntersectionObserver((entries) => {
      setActive(entries.some((entry) => entry.isIntersecting));
    }, { rootMargin: "15% 0px", threshold: 0.01 });
    observer.observe(svg);
    queueViewportSync();
  } else {
    setActive(true);
  }

  win.addEventListener("pageshow", queueViewportSync, { passive: true });
  win.addEventListener("resize", queueViewportSync, { passive: true });
  win.addEventListener("scroll", queueViewportSync, { passive: true });

  doc.addEventListener("visibilitychange", () => {
    if (doc.hidden) {
      setActive(false);
      return;
    }
    queueViewportSync();
  });
}

export function mountJesteiProcessScene(root = document) {
  root.querySelectorAll(CARD_SELECTOR).forEach((card) => {
    let svg = card.querySelector(SCENE_SELECTOR);
    if (!svg) svg = createProcessVisual(card);
    initializeScene(svg);
  });
}
