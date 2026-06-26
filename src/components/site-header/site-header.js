const SVG_NS = "http://www.w3.org/2000/svg";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const AWFULFACE_VIEWBOX = {
  x: -82,
  y: -88,
  width: 164,
  height: 176,
};

const AWFULFACE_EYES = {
  left: { x: -62, y: -8 },
  right: { x: 26, y: -24 },
};

function createSvgElement(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag);

  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });

  return element;
}

function createAwfulfaceLine(attrs = {}) {
  return createSvgElement("path", {
    stroke: "#222222",
    "stroke-width": "9",
    fill: "none",
    ...attrs,
  });
}

function createAwfulfaceSvg() {
  const svg = createSvgElement("svg", {
    viewBox: `${AWFULFACE_VIEWBOX.x} ${AWFULFACE_VIEWBOX.y} ${AWFULFACE_VIEWBOX.width} ${AWFULFACE_VIEWBOX.height}`,
    "aria-hidden": "true",
    focusable: "false",
  });

  const root = createSvgElement("g", { "data-awfulface-root": "" });

  const leftEye = createSvgElement("ellipse", {
    cx: AWFULFACE_EYES.left.x,
    cy: AWFULFACE_EYES.left.y,
    rx: "7",
    ry: "5",
    fill: "#222222",
  });

  const rightEye = createSvgElement("ellipse", {
    cx: AWFULFACE_EYES.right.x,
    cy: AWFULFACE_EYES.right.y,
    rx: "7",
    ry: "5",
    fill: "#222222",
  });

  const dashGroup = createSvgElement("g", { transform: "translate(-20 5)" });
  dashGroup.appendChild(createAwfulfaceLine({ d: "M -5 62 L 30 82" }));

  const shapes = [
    { name: "left-eye", node: leftEye },
    { name: "right-eye", node: rightEye },
    { name: "brow", node: createAwfulfaceLine({ d: "M -25 -28 L 30 -65" }) },
    { name: "dash", node: dashGroup },
    {
      name: "nose",
      node: createAwfulfaceLine({
        d: "M -75 -48 Q -30 -45 -25 -32 Q -20 0 -20 -5 Q -20 15 -5 7 Q 15 -10 1 0",
        "stroke-linejoin": "round",
      }),
    },
    {
      name: "mouth",
      node: createAwfulfaceLine({
        d: "M -60 55 Q -35 27 -20 48 Q -15 70 10 35 Q 22 32 35 48 Q 55 42 50 46",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    },
  ];

  shapes.forEach(({ name, node }) => {
    const part = createSvgElement("g", { "data-awfulface-part": name });
    part.appendChild(node);
    root.appendChild(part);
  });

  svg.appendChild(root);

  return {
    svg,
    eyes: {
      left: leftEye,
      right: rightEye,
    },
  };
}

function setAwfulfaceEyes(eyes, leftX, leftY, rightX, rightY) {
  eyes.left.setAttribute("cx", leftX.toFixed(2));
  eyes.left.setAttribute("cy", leftY.toFixed(2));
  eyes.right.setAttribute("cx", rightX.toFixed(2));
  eyes.right.setAttribute("cy", rightY.toFixed(2));
}

function resetAwfulfaceEyes(eyes) {
  setAwfulfaceEyes(
    eyes,
    AWFULFACE_EYES.left.x,
    AWFULFACE_EYES.left.y,
    AWFULFACE_EYES.right.x,
    AWFULFACE_EYES.right.y,
  );
}

function getLimitedEyeOffset(pointerX, pointerY, centerX, centerY, radiusX, radiusY) {
  const dx = pointerX - centerX;
  const dy = pointerY - centerY;
  const distance = Math.hypot(dx, dy);

  if (!distance) {
    return { x: 0, y: 0 };
  }

  const strength = Math.min(distance / 240, 1);

  return {
    x: (dx / distance) * radiusX * strength,
    y: (dy / distance) * radiusY * strength,
  };
}

function updateAwfulfaceEyes({ svg, eyes, pointer }) {
  const rect = svg.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const faceCenterX = rect.left + rect.width / 2;
  const faceCenterY = rect.top + rect.height / 2;

  const leftOffset = getLimitedEyeOffset(pointer.clientX, pointer.clientY, faceCenterX, faceCenterY, 8.2, 5.8);
  const rightOffset = getLimitedEyeOffset(pointer.clientX, pointer.clientY, faceCenterX, faceCenterY, 8.2, 4.8);

  setAwfulfaceEyes(
    eyes,
    AWFULFACE_EYES.left.x + leftOffset.x,
    AWFULFACE_EYES.left.y + leftOffset.y,
    AWFULFACE_EYES.right.x + rightOffset.x,
    AWFULFACE_EYES.right.y + rightOffset.y,
  );
}

function mountAwfulfaceTrigger(containerId = "site-header-awfulface") {
  const container = document.getElementById(containerId);

  if (!container || container.dataset.awfulfaceMounted === "true") {
    return;
  }

  const { svg, eyes } = createAwfulfaceSvg();

  container.dataset.awfulfaceMounted = "true";
  container.appendChild(svg);
  resetAwfulfaceEyes(eyes);

  if (window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches) {
    return;
  }

  let frame = 0;
  let lastPointer = null;

  const scheduleUpdate = () => {
    if (frame) {
      return;
    }

    frame = window.requestAnimationFrame(() => {
      frame = 0;

      if (lastPointer) {
        updateAwfulfaceEyes({ svg, eyes, pointer: lastPointer });
      }
    });
  };

  const handlePointerMove = (event) => {
    lastPointer = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    scheduleUpdate();
  };

  const handleVisibilityReset = () => {
    lastPointer = null;

    if (frame) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    resetAwfulfaceEyes(eyes);
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("mousemove", handlePointerMove, { passive: true });
  window.addEventListener("blur", handleVisibilityReset);
}

export function initSiteHeader(root = document) {
  const gsap = window.gsap;
  const Flip = window.Flip;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap || !Flip || !ScrollTrigger) {
    console.error("[site-header] gsap, Flip or ScrollTrigger is not loaded");
    return;
  }

  gsap.registerPlugin(Flip, ScrollTrigger);
  mountAwfulfaceTrigger("site-header-awfulface");

  const island = root.querySelector("[data-nav-island]");
  const chipsNav = root.querySelector("[data-nav-chips]");
  const chips = chipsNav ? Array.from(chipsNav.querySelectorAll("[data-nav-chip]")) : [];
  const trigger = root.querySelector("[data-nav-trigger]");
  const menu = root.querySelector("[data-nav-menu]");
  const menuLinks = menu ? Array.from(menu.querySelectorAll("[data-nav-menu-link]")) : [];

  if (!island || !chipsNav || !chips.length || !trigger || !menu || !menuLinks.length) {
    return;
  }

  const media = gsap.matchMedia();

  let activeHref = "#project-jesteipool";
  let activeChip = chips.find((chip) => chip.getAttribute("href") === activeHref) || chips[0];
  let hoverChip = null;
  let collapsed = false;
  let forcedMobile = false;
  let menuProgress = { value: 0 };
  let isMenuVisible = false;
  let lastPointer = { x: -9999, y: -9999 };
  let delayedFade = null;
  let flipTween = null;
  let scrollTicking = false;

  const getHeroBottom = () => {
    const hero = root.querySelector("#hero");

    if (!(hero instanceof HTMLElement)) {
      return window.innerHeight;
    }

    const rect = hero.getBoundingClientRect();

    return Math.round(window.scrollY + rect.bottom);
  };

  const collapseStart = () => {
    if (forcedMobile) {
      return getHeroBottom();
    }

    return Math.round(window.innerHeight * 0.68);
  };

  const expandBack = () => {
    if (forcedMobile) {
      return Math.max(0, getHeroBottom() - Math.round(window.innerHeight * 0.18));
    }

    return Math.round(window.innerHeight * 0.36);
  };

  const chipStates = {
    default: {
      scale: 1,
      backgroundColor: "#ffffff",
      borderColor: "rgba(0, 0, 0, 0.82)",
      color: "rgba(0, 0, 0, 0.76)",
      opacity: 1,
    },
    hover: {
      scale: 1.1,
      backgroundColor: "#ffffff",
      borderColor: "rgba(0, 0, 0, 1)",
      color: "rgba(0, 0, 0, 1)",
      opacity: 1,
    },
    active: {
      scale: 1,
      backgroundColor: "#ffffff",
      borderColor: "rgba(0, 0, 0, 1)",
      color: "rgba(0, 0, 0, 1)",
      opacity: 1,
    },
    activeHover: {
      scale: 1.11,
      backgroundColor: "#ffffff",
      borderColor: "rgba(0, 0, 0, 1)",
      color: "rgba(0, 0, 0, 1)",
      opacity: 1,
    },
    neighbor: {
      scale: 0.9,
      backgroundColor: "#ffffff",
      borderColor: "rgba(0, 0, 0, 0.72)",
      color: "rgba(0, 0, 0, 0.64)",
      opacity: 0.96,
    },
  };

  const semanticStateFor = (chip) => {
    if (chip === activeChip && chip === hoverChip) {
      return "activeHover";
    }

    if (chip === hoverChip) {
      return "hover";
    }

    if (chip === activeChip) {
      return "active";
    }

    if (hoverChip) {
      const chipIndex = chips.indexOf(chip);
      const hoverIndex = chips.indexOf(hoverChip);

      if (Math.abs(chipIndex - hoverIndex) === 1) {
        return "neighbor";
      }
    }

    return "default";
  };

  const renderChips = (instant = false) => {
    chips.forEach((chip) => {
      const stateName = semanticStateFor(chip);

      chip.dataset.navState = stateName;
      chip.classList.toggle("is-active", chip === activeChip);

      gsap.to(chip, {
        ...chipStates[stateName],
        duration: instant ? 0 : 0.24,
        ease: "power3.out",
        overwrite: true,
      });
    });
  };

  const setActiveByHref = (href) => {
    activeHref = href;
    activeChip = chips.find((chip) => chip.getAttribute("href") === href) || activeChip;

    menuLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === href);
    });

    renderChips();
  };

  const setHover = (chip, temporary = false) => {
    hoverChip = chip;
    renderChips();

    if (temporary) {
      window.setTimeout(() => {
        if (hoverChip === chip) {
          hoverChip = null;
          renderChips();
        }
      }, 850);
    }
  };

  const clearHover = () => {
    hoverChip = null;
    renderChips();
  };

  const setCollapsedClass = (value) => {
    collapsed = value;
    island.classList.toggle("is-collapsed", value);
    island.classList.toggle("is-expanded", !value);
    trigger.setAttribute("aria-hidden", value ? "false" : "true");
    chipsNav.setAttribute("aria-hidden", value ? "true" : "false");
  };

  const morphNav = (value, instant = false) => {
    if (collapsed === value && !instant) {
      return;
    }

    if (!value) {
      setMenuProgress(0, true);
    }

    const state = Flip.getState([island, chipsNav, trigger, ...chips], {
      props: "opacity,visibility,transform,backgroundColor,borderColor,color",
    });

    setCollapsedClass(value);

    if (flipTween) {
      flipTween.kill();
    }

    flipTween = Flip.from(state, {
      duration: instant ? 0 : 0.58,
      ease: "power3.inOut",
      absolute: true,
      nested: true,
      fade: true,
      prune: true,
      onComplete: () => {
        renderChips(true);
      },
    });

    gsap.to(trigger, {
      autoAlpha: value ? 1 : 0,
      scale: value ? 1 : 0.84,
      duration: instant ? 0 : 0.3,
      ease: value ? "back.out(1.7)" : "power2.out",
      overwrite: true,
    });

    gsap.to(chipsNav, {
      autoAlpha: value ? 0 : 1,
      x: value ? 10 : 0,
      duration: instant ? 0 : 0.24,
      ease: "power2.out",
      overwrite: true,
    });

    gsap.to(chips, {
      autoAlpha: value ? 0 : 1,
      scale: value ? 0.9 : 1,
      duration: instant ? 0 : 0.24,
      stagger: value ? { each: 0.018, from: "end" } : { each: 0.018, from: "start" },
      ease: "power2.out",
      overwrite: true,
    });
  };

  const menuTimeline = gsap
    .timeline({ paused: true })
    .fromTo(
      menu,
      { autoAlpha: 0, y: -10, scale: 0.96 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.34,
        ease: "power3.out",
      },
      0,
    )
    .fromTo(
      menuLinks,
      { autoAlpha: 0, y: -6, scale: 0.97 },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.24,
        stagger: 0.04,
        ease: "power3.out",
      },
      0.04,
    );

  const setMenuVisibility = (value) => {
    isMenuVisible = value;
    menu.classList.toggle("is-open", value);
    menu.setAttribute("aria-hidden", value ? "false" : "true");
    trigger.setAttribute("aria-expanded", value ? "true" : "false");

    menuLinks.forEach((link) => {
      link.setAttribute("tabindex", value ? "0" : "-1");
    });
  };

  const setMenuProgress = (value) => {
    const next = Math.max(0, Math.min(1, value));
    menuProgress.value = next;

    if (next > 0.001 && !isMenuVisible) {
      setMenuVisibility(true);
    }

    menuTimeline.progress(next);

    if (next <= 0.001 && isMenuVisible) {
      setMenuVisibility(false);
    }
  };

  const tweenMenuProgress = (value, duration = 0.2) => {
    gsap.to(menuProgress, {
      value,
      duration,
      ease: "power3.out",
      overwrite: true,
      onUpdate: () => setMenuProgress(menuProgress.value),
    });
  };

  const getInteractionRect = () => {
    const triggerRect = trigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const pad = forcedMobile ? 18 : 30;

    return {
      left: Math.min(triggerRect.left, menuRect.left) - pad,
      top: Math.min(triggerRect.top, menuRect.top) - pad,
      right: Math.max(triggerRect.right, menuRect.right) + pad,
      bottom: Math.max(triggerRect.bottom, menuRect.bottom) + pad,
    };
  };

  const distanceToRect = (x, y, rect) => {
    const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
    const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;

    return Math.hypot(dx, dy);
  };

  const updateMenuByPointer = () => {
    if (!collapsed || forcedMobile) {
      return;
    }

    const rect = getInteractionRect();
    const distance = distanceToRect(lastPointer.x, lastPointer.y, rect);
    const inside = distance <= 0.5;
    const fadeDistance = 150;
    const progress = inside ? 1 : Math.max(0, 1 - distance / fadeDistance);

    if (inside) {
      if (delayedFade) {
        window.clearTimeout(delayedFade);
        delayedFade = null;
      }

      tweenMenuProgress(1, 0.14);
      return;
    }

    if (progress <= 0.001) {
      if (!delayedFade) {
        delayedFade = window.setTimeout(() => {
          tweenMenuProgress(0, 0.24);
          delayedFade = null;
        }, 110);
      }

      return;
    }

    if (delayedFade) {
      window.clearTimeout(delayedFade);
      delayedFade = null;
    }

    tweenMenuProgress(progress, 0.12);
  };

  const syncCollapsedToScroll = (instant = false) => {
    if (!collapsed && window.scrollY > collapseStart()) {
      morphNav(true, instant);
      return;
    }

    if (collapsed && window.scrollY < expandBack()) {
      morphNav(false, instant);
    }
  };

  chips.forEach((chip) => {
    chip.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        setHover(chip);
      }
    });

    chip.addEventListener("focus", () => setHover(chip));

    chip.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") {
        setHover(chip, true);
      }
    });
  });

  chipsNav.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") {
      clearHover();
    }
  });

  chipsNav.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!chipsNav.contains(document.activeElement)) {
        clearHover();
      }
    }, 0);
  });

  trigger.addEventListener("mouseenter", () => {
    if (!forcedMobile) {
      tweenMenuProgress(1, 0.16);
    }
  });

  menu.addEventListener("mouseenter", () => {
    if (!forcedMobile) {
      tweenMenuProgress(1, 0.16);
    }
  });

  document.addEventListener("mousemove", (event) => {
    lastPointer = { x: event.clientX, y: event.clientY };
    updateMenuByPointer();
  });

  trigger.addEventListener("click", () => {
    if (!forcedMobile) {
      return;
    }

    tweenMenuProgress(menuProgress.value > 0.5 ? 0 : 1, 0.22);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!forcedMobile) {
      return;
    }

    if (trigger.contains(event.target) || menu.contains(event.target)) {
      return;
    }

    tweenMenuProgress(0, 0.18);
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveByHref(link.getAttribute("href"));

      if (forcedMobile) {
        tweenMenuProgress(0, 0.18);
      }
    });
  });

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: "top top",
    end: "bottom bottom",
    onUpdate: () => {
      if (scrollTicking) {
        return;
      }

      scrollTicking = true;

      window.requestAnimationFrame(() => {
        syncCollapsedToScroll();
        scrollTicking = false;
      });
    },
  });

  ["#resume", "#project-jesteipool", "#project-styx", "#project-shootings"].forEach((selector) => {
    const section = root.querySelector(selector);
    const chip = chips.find((item) => item.getAttribute("href") === selector);

    if (!section || !chip) {
      return;
    }

    ScrollTrigger.create({
      trigger: section,
      start: "top 42%",
      end: "bottom 42%",
      onEnter: () => setActiveByHref(selector),
      onEnterBack: () => setActiveByHref(selector),
    });
  });

  media.add("(max-width: 48rem)", () => {
    forcedMobile = true;
    setMenuProgress(0);
    syncCollapsedToScroll(true);

    return () => {
      forcedMobile = false;
      setMenuProgress(0);
      syncCollapsedToScroll(true);
    };
  });

  window.addEventListener("resize", () => {
    syncCollapsedToScroll(true);
  });

  renderChips(true);
  syncCollapsedToScroll(true);
}