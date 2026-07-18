import { gsap } from "gsap";

const FACE_SIZE = 400;
const FACE_HALF = FACE_SIZE / 2;

const EYE_TRACK_STRENGTH_X = 7.5;
const EYE_TRACK_STRENGTH_Y = 6;

const FIT_SAFE_GAP = 2;
const FIT_MIN_FONT_SIZE = 20;

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const PRECISE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";

const EYES = {
  left: {
    x: -62,
    y: -8,
  },

  right: {
    x: 26,
    y: -24,
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function splitTextIntoGraphemes(text) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("ru", {
      granularity: "grapheme",
    });

    return [...segmenter.segment(text)].map(({ segment }) => segment);
  }

  return Array.from(text);
}

function createWord(text, animateLetters, startIndex) {
  const word = document.createElement("span");

  word.className = "hero-title-word";

  let index = startIndex;

  if (!animateLetters) {
    word.textContent = text;

    return {
      word,
      nextIndex: index,
    };
  }

  splitTextIntoGraphemes(text).forEach((letter) => {
    const letterElement = document.createElement("span");

    letterElement.className = "hero-title-letter";

    letterElement.dataset.heroLetter = String(index);

    letterElement.textContent = letter;

    word.appendChild(letterElement);

    index += 1;
  });

  return {
    word,
    nextIndex: index,
  };
}

function wrapLine(line, startIndex, animateLetters) {
  const words = line.textContent.trim().split(/\s+/).filter(Boolean);

  const fragment = document.createDocumentFragment();

  let index = startIndex;

  words.forEach((text) => {
    const result = createWord(text, animateLetters, index);

    fragment.appendChild(result.word);

    index = result.nextIndex;
  });

  line.textContent = "";

  line.appendChild(fragment);

  return index;
}

function measureLineContent(line) {
  const words = [...line.querySelectorAll(":scope > .hero-title-word")];

  if (!words.length) {
    return 0;
  }

  if (line.dataset.heroTitleLine === "name") {
    const style = getComputedStyle(line);

    const gap = Number.parseFloat(style.columnGap) || 0;

    return (
      words.reduce((total, word) => total + word.scrollWidth, 0) +
      gap * Math.max(0, words.length - 1)
    );
  }

  return words.reduce((max, word) => Math.max(max, word.scrollWidth), 0);
}

function fitLine(line) {
  line.style.fontSize = "";

  const availableWidth = Math.max(0, line.clientWidth - FIT_SAFE_GAP);

  const baseFontSize = Number.parseFloat(getComputedStyle(line).fontSize);

  if (!availableWidth || !Number.isFinite(baseFontSize) || baseFontSize <= 0) {
    return;
  }

  const contentWidth = measureLineContent(line);

  if (!contentWidth || contentWidth <= availableWidth) {
    return;
  }

  const nextSize = Math.max(
    FIT_MIN_FONT_SIZE,

    Math.floor(baseFontSize * (availableWidth / contentWidth) * 1000) / 1000,
  );

  line.style.fontSize = `${nextSize}px`;
}

function createFitController(title, lines) {
  const headline = title.closest(".hero__headline") || title;

  let frame = 0;

  const fit = () => {
    frame = 0;

    lines.forEach(fitLine);
  };

  const schedule = () => {
    if (frame) {
      return;
    }

    frame = requestAnimationFrame(fit);
  };

  schedule();

  document.fonts?.ready?.then(schedule).catch(() => {});

  const observer = window.ResizeObserver ? new ResizeObserver(schedule) : null;

  observer?.observe(headline);

  window.addEventListener("resize", schedule, {
    passive: true,
  });

  window.addEventListener("orientationchange", schedule, {
    passive: true,
  });

  return () => {
    if (frame) {
      cancelAnimationFrame(frame);
    }

    observer?.disconnect();

    window.removeEventListener("resize", schedule);

    window.removeEventListener("orientationchange", schedule);

    lines.forEach((line) => {
      line.style.fontSize = "";
    });
  };
}

const HERO_LETTER_EVENTS = [
  {
    type: "jump",
    index: 4,
    delay: 2.4,
    repeatDelay: 9.5,
    y: -8,
    speed: 1,
  },

  {
    type: "jump",
    index: 18,
    delay: 6.8,
    repeatDelay: 11.2,
    y: -8,
    speed: 1,
  },

  {
    type: "flip",
    index: 6,
    delay: 4.8,
    repeatDelay: 12,
    speed: 1,
  },

  {
    type: "wobble",
    index: 13,
    delay: 8.2,
    repeatDelay: 10.5,
    rotation: 6,
    y: -3,
    speed: 1,
  },

  {
    type: "stretch",
    index: 22,
    delay: 12.4,
    repeatDelay: 13.5,
    scaleX: 1.16,
    scaleY: 0.92,
    speed: 1,
  },
];

function getHeroLetter(letters, index) {
  if (!letters.length) {
    return null;
  }

  const normalizedIndex = Math.abs(Math.trunc(index)) % letters.length;

  return letters[normalizedIndex];
}

function createJumpTimeline(letter, event) {
  const speed = event.speed || 1;

  return gsap
    .timeline()
    .to(letter, {
      y: event.y ?? -6,
      duration: 0.2 * speed,
      ease: "power2.out",
    })
    .to(
      letter,
      {
        y: 0,
        duration: 0.42 * speed,
        ease: "power2.inOut",
      },
      "+=0.28",
    );
}

function createFlipTimeline(letter, event) {
  const speed = event.speed || 1;

  return gsap
    .timeline()
    .to(letter, {
      rotationX: 180,
      duration: 0.4 * speed,
      ease: "power2.inOut",
    })
    .to(
      letter,
      {
        rotationX: 360,
        duration: 0.46 * speed,
        ease: "power2.inOut",
      },
      "+=0.12",
    )
    .set(letter, {
      rotationX: 0,
    });
}

function createWobbleTimeline(letter, event) {
  const speed = event.speed || 1;

  const rotation = event.rotation ?? 5;

  const y = event.y ?? -2;

  return gsap
    .timeline()
    .to(letter, {
      rotation: -rotation,
      y,
      duration: 0.23 * speed,
      ease: "power1.out",
    })
    .to(letter, {
      rotation: rotation * 0.84,

      y: 1,

      duration: 0.28 * speed,

      ease: "power1.inOut",
    })
    .to(letter, {
      rotation: -rotation * 0.34,

      y: 0,

      duration: 0.24 * speed,

      ease: "power1.inOut",
    })
    .to(letter, {
      rotation: 0,
      y: 0,

      duration: 0.36 * speed,

      ease: "power2.out",
    });
}

function createStretchTimeline(letter, event) {
  const speed = event.speed || 1;

  return gsap
    .timeline()
    .to(letter, {
      scaleX: event.scaleX ?? 1.08,

      scaleY: event.scaleY ?? 0.95,

      duration: 0.28 * speed,

      ease: "power2.out",
    })
    .to(
      letter,
      {
        scaleX: 1,
        scaleY: 1,

        duration: 0.44 * speed,

        ease: "power2.inOut",
      },
      "+=0.06",
    );
}

function createHeroLetterTimeline(letter, event) {
  if (!letter) {
    return null;
  }

  const timeline = gsap.timeline({
    repeat: -1,

    repeatDelay: event.repeatDelay ?? 12,

    delay: event.delay ?? 0,

    paused: true,
  });

  if (event.type === "flip") {
    timeline.add(createFlipTimeline(letter, event), 0);
  } else if (event.type === "wobble") {
    timeline.add(createWobbleTimeline(letter, event), 0);
  } else if (event.type === "stretch") {
    timeline.add(createStretchTimeline(letter, event), 0);
  } else {
    timeline.add(createJumpTimeline(letter, event), 0);
  }

  return timeline;
}

function bindHeroLetterPlayback(title, timelines) {
  if (!("IntersectionObserver" in window)) {
    timelines.forEach((timeline) => {
      timeline.play();
    });

    return null;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      timelines.forEach((timeline) => {
        if (entry?.isIntersecting) {
          timeline.play();
        } else {
          timeline.pause();
        }
      });
    },
    {
      threshold: 0,

      rootMargin: "18% 0px 18% 0px",
    },
  );

  observer.observe(title);

  return () => {
    observer.disconnect();
  };
}

export function createHeroTitleMotion({ title } = {}) {
  if (!(title instanceof HTMLElement)) {
    return null;
  }

  if (title.dataset.heroMotionMounted === "true") {
    return null;
  }

  const nameLine = title.querySelector('[data-hero-title-line="name"]');

  const roleLine = title.querySelector('[data-hero-title-line="role"]');

  if (!(nameLine instanceof HTMLElement) || !(roleLine instanceof HTMLElement)) {
    return null;
  }

  const lines = [nameLine, roleLine];

  const originalMarkup = lines.map((line) => line.innerHTML);

  const originalLabel = title.getAttribute("aria-label");

  title.dataset.heroMotionMounted = "true";

  title.setAttribute(
    "aria-label",

    lines.map((line) => line.textContent.trim()).join(" "),
  );

  let letterIndex = 0;

  letterIndex = wrapLine(nameLine, letterIndex, true);

  wrapLine(roleLine, letterIndex, false);

  lines.forEach((line) => {
    line.setAttribute("aria-hidden", "true");
  });

  const destroyFit = createFitController(title, lines);

  const letters = [...nameLine.querySelectorAll(".hero-title-letter")];

  const media = gsap.matchMedia();

  media.add("(prefers-reduced-motion: no-preference)", () => {
    gsap.set(letters, {
      transformOrigin: "50% 58%",

      transformPerspective: 900,

      force3D: true,
    });

    const timelines = HERO_LETTER_EVENTS.map((event) => {
      const letter = getHeroLetter(letters, event.index);

      return createHeroLetterTimeline(letter, event);
    }).filter(Boolean);

    const disconnect = bindHeroLetterPlayback(title, timelines);

    return () => {
      disconnect?.();

      timelines.forEach((timeline) => {
        timeline.kill();
      });
    };
  });

  return function destroyHeroTitleMotion() {
    media.revert();

    destroyFit();

    lines.forEach((line, index) => {
      line.innerHTML = originalMarkup[index];

      line.removeAttribute("aria-hidden");
    });

    if (originalLabel === null) {
      title.removeAttribute("aria-label");
    } else {
      title.setAttribute("aria-label", originalLabel);
    }

    delete title.dataset.heroMotionMounted;
  };
}

function drawStroke(context, draw) {
  context.beginPath();

  draw(context);

  context.stroke();
}

function withTransform(context, transform, draw) {
  context.save();

  context.translate(transform.x || 0, transform.y || 0);

  context.rotate(transform.rotation || 0);

  draw(context);

  context.restore();
}

function drawFace(context, state, metrics) {
  const { pixelWidth, pixelHeight, cssWidth, cssHeight, dpr } = metrics;

  context.setTransform(1, 0, 0, 1, 0, 0);

  context.clearRect(0, 0, pixelWidth, pixelHeight);

  const scale = Math.min(cssWidth, cssHeight) / FACE_SIZE;

  context.setTransform(dpr * scale, 0, 0, dpr * scale, pixelWidth / 2, pixelHeight / 2);

  context.strokeStyle = "#222222";

  context.fillStyle = "#222222";

  context.lineWidth = 9;
  context.lineCap = "round";
  context.lineJoin = "round";

  const idleX = (state.idle - 0.5) * 2.4;

  const idleY = (state.idleY - 0.5) * 1.8;

  context.save();

  context.translate(
    state.pointerX * 2.5 + idleX,

    state.pointerY * 1.7 + state.scroll * 3.2 + idleY,
  );

  /*
   * Переводим нормализованные
   * координаты курсора обратно
   * в систему координат лица.
   */
  const pointerFaceX = state.pointerX * FACE_HALF;

  const pointerFaceY = state.pointerY * FACE_HALF;

  const pointerInfluence = state.pointerActive;

  /*
   * Каждый глаз рассчитывается
   * отдельно относительно своей
   * исходной позиции.
   *
   * Поэтому при движении вправо
   * один глаз проходит большее
   * расстояние, а при движении
   * влево — второй.
   */
  const leftEyeX =
    ((pointerFaceX - EYES.left.x) / FACE_HALF) * EYE_TRACK_STRENGTH_X * pointerInfluence;

  const leftEyeY =
    ((pointerFaceY - EYES.left.y) / FACE_HALF) * EYE_TRACK_STRENGTH_Y * pointerInfluence;

  const rightEyeX =
    ((pointerFaceX - EYES.right.x) / FACE_HALF) * EYE_TRACK_STRENGTH_X * pointerInfluence;

  /*
   * Вертикальная амплитуда
   * второго глаза меньше,
   * как в исходной реализации.
   */
  const rightEyeY =
    ((pointerFaceY - EYES.right.y) / FACE_HALF) * 0.5 * EYE_TRACK_STRENGTH_Y * pointerInfluence;

  withTransform(
    context,
    {
      x: state.pointerX * -2.6,

      y: state.pointerY * -1.8 + state.scroll * -1.4,

      rotation: state.pointerX * -0.012,
    },
    () => {
      context.beginPath();

      context.ellipse(
        EYES.left.x + leftEyeX,

        EYES.left.y + leftEyeY,

        7,
        5,
        0,
        0,
        Math.PI * 2,
      );

      context.fill();

      context.beginPath();

      context.ellipse(
        EYES.right.x + rightEyeX,

        EYES.right.y + rightEyeY,

        7,
        5,
        0,
        0,
        Math.PI * 2,
      );

      context.fill();
    },
  );

  withTransform(
    context,
    {
      x: state.pointerX * 3.4,

      y: state.pointerY * 2.2 + state.scroll * -2.2,

      rotation: state.pointerX * 0.018,
    },
    () => {
      drawStroke(context, (path) => {
        path.moveTo(-25, -28);

        path.lineTo(30, -65);
      });
    },
  );

  withTransform(
    context,
    {
      x: state.pointerX * -2.2,

      y: state.pointerY * 1.8 + state.scroll * 1.8,

      rotation: state.pointerX * -0.01,
    },
    () => {
      drawStroke(context, (path) => {
        path.moveTo(-25, 67);

        path.lineTo(10, 87);
      });
    },
  );

  withTransform(
    context,
    {
      x: state.pointerX * 2.1,

      y: state.pointerY * 1.6 + state.scroll * 1.1,

      rotation: state.pointerX * 0.009,
    },
    () => {
      drawStroke(context, (path) => {
        path.moveTo(-75, -48);

        path.quadraticCurveTo(-30, -45, -25, -32);

        path.quadraticCurveTo(-20, 0, -20, -5);

        path.quadraticCurveTo(-20, 15, -5, 7);

        path.quadraticCurveTo(15, -10, 1, 0);
      });
    },
  );

  withTransform(
    context,
    {
      x: state.pointerX * 1.5,

      y: state.pointerY * 2.7 + state.scroll * 2.8,

      rotation: state.pointerX * 0.012,
    },
    () => {
      drawStroke(context, (path) => {
        path.moveTo(-60, 55);

        path.quadraticCurveTo(-35, 27, -20, 48);

        path.quadraticCurveTo(-15, 70, 10, 35);

        path.quadraticCurveTo(22, 32, 35, 48);

        path.quadraticCurveTo(55, 42, 50, 46);
      });
    },
  );

  context.restore();
}

export function createAwfulheadMotion({ root, canvas } = {}) {
  if (!(root instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement)) {
    return null;
  }

  if (canvas.dataset.awfulheadMounted === "true") {
    return null;
  }

  const context = canvas.getContext("2d", {
    alpha: true,
  });

  if (!context) {
    return null;
  }

  canvas.dataset.awfulheadMounted = "true";

  const reducedMotion = matchMedia(REDUCED_MOTION_QUERY);

  const precisePointer = matchMedia(PRECISE_POINTER_QUERY);

  const state = {
    pointerX: 0,
    pointerY: 0,
    pointerActive: 0,
    scroll: 0,
    idle: 0,
    idleY: 1,
  };

  const metrics = {
    cssWidth: 1,
    cssHeight: 1,
    pixelWidth: 1,
    pixelHeight: 1,
    dpr: 1,
  };

  let visible = true;

  const setPointerX = gsap.quickTo(state, "pointerX", {
    duration: 0.65,
    ease: "power3.out",
  });

  const setPointerY = gsap.quickTo(state, "pointerY", {
    duration: 0.65,
    ease: "power3.out",
  });

  const setPointerActive = gsap.quickTo(state, "pointerActive", {
    duration: 0.35,
    ease: "power2.out",
  });

  const setScroll = gsap.quickTo(state, "scroll", {
    duration: 0.8,
    ease: "power3.out",
  });

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect();

    const cssWidth = Math.max(1, rect.width);

    const cssHeight = Math.max(1, rect.height);

    const dpr = clamp(devicePixelRatio || 1, 1, 2);

    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));

    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;

      canvas.height = pixelHeight;
    }

    Object.assign(metrics, {
      cssWidth,
      cssHeight,
      pixelWidth,
      pixelHeight,
      dpr,
    });

    drawFace(context, state, metrics);
  };

  const updatePointer = (event) => {
    if (!precisePointer.matches || reducedMotion.matches) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    setPointerActive(1);

    setPointerX(
      clamp(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,

        -1,
        1,
      ),
    );

    setPointerY(
      clamp(
        ((event.clientY - rect.top) / rect.height) * 2 - 1,

        -1,
        1,
      ),
    );
  };

  const resetPointer = () => {
    setPointerActive(0);
    setPointerX(0);
    setPointerY(0);
  };

  const updateScroll = () => {
    if (reducedMotion.matches) {
      setScroll(0);
      return;
    }

    const rect = root.getBoundingClientRect();

    const viewportCenter = innerHeight / 2;

    const rootCenter = rect.top + rect.height / 2;

    const range = Math.max(innerHeight, rect.height) / 2;

    setScroll(
      clamp(
        (viewportCenter - rootCenter) / range,

        -1,
        1,
      ),
    );
  };

  const render = () => {
    if (!visible) {
      return;
    }

    drawFace(context, state, metrics);
  };

  gsap.ticker.add(render);

  const media = gsap.matchMedia();

  media.add("(prefers-reduced-motion: no-preference)", () => {
    const idleX = gsap.to(state, {
      idle: 1,
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    const idleY = gsap.to(state, {
      idleY: 0,
      duration: 3.6,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    return () => {
      idleX.kill();
      idleY.kill();

      gsap.set(state, {
        idle: 0,
        idleY: 1,
        pointerX: 0,
        pointerY: 0,
        pointerActive: 0,
        scroll: 0,
      });
    };
  });

  const resizeObserver = window.ResizeObserver ? new ResizeObserver(resizeCanvas) : null;

  const intersectionObserver = window.IntersectionObserver
    ? new IntersectionObserver(
        ([entry]) => {
          visible = Boolean(entry?.isIntersecting);

          if (visible) {
            resizeCanvas();
          }
        },
        {
          threshold: 0.01,
        },
      )
    : null;

  resizeObserver?.observe(canvas);

  intersectionObserver?.observe(root);

  document.addEventListener("pointermove", updatePointer, {
    passive: true,
  });

  document.addEventListener("pointerout", resetPointer, {
    passive: true,
  });

  window.addEventListener("blur", resetPointer);

  window.addEventListener("scroll", updateScroll, {
    passive: true,
  });

  window.addEventListener("resize", resizeCanvas, {
    passive: true,
  });

  const handleMotionPreference = () => {
    resetPointer();
    updateScroll();
    resizeCanvas();
  };

  reducedMotion.addEventListener("change", handleMotionPreference);

  precisePointer.addEventListener("change", resetPointer);

  updateScroll();
  resizeCanvas();

  return function destroyAwfulheadMotion() {
    media.revert();

    gsap.ticker.remove(render);

    gsap.killTweensOf(state);

    resizeObserver?.disconnect();

    intersectionObserver?.disconnect();

    document.removeEventListener("pointermove", updatePointer);

    document.removeEventListener("pointerout", resetPointer);

    window.removeEventListener("blur", resetPointer);

    window.removeEventListener("scroll", updateScroll);

    window.removeEventListener("resize", resizeCanvas);

    reducedMotion.removeEventListener("change", handleMotionPreference);

    precisePointer.removeEventListener("change", resetPointer);

    context.setTransform(1, 0, 0, 1, 0, 0);

    context.clearRect(0, 0, canvas.width, canvas.height);

    delete canvas.dataset.awfulheadMounted;
  };
}
