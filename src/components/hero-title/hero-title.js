const TITLE_SELECTOR = "#hero-title";
const LINE_SELECTOR = ".hero__title-name, .hero__title-role";
const LETTER_SELECTOR = ".hero-title-letter";
const LETTER_COLOR = "#111111";
const FIT_SAFE_GAP = 2;
const FIT_MIN_FONT_SIZE = 20;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function getGsap() {
  return window.gsap || null;
}

function splitTextIntoGraphemes(text) {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    const segmenter = new Intl.Segmenter("ru", { granularity: "grapheme" });
    return [...segmenter.segment(text)].map((segment) => segment.segment);
  }

  return [...text];
}

function wrapLineLetters(line, startIndex = 0) {
  const words = line.textContent.trim().split(/\s+/);
  const fragment = document.createDocumentFragment();
  let letterIndex = startIndex;

  words.forEach((word) => {
    const wordElement = document.createElement("span");
    wordElement.className = "hero-title-word";

    splitTextIntoGraphemes(word).forEach((letter) => {
      const letterElement = document.createElement("span");

      letterElement.className = "hero-title-letter";
      letterElement.dataset.heroLetter = String(letterIndex);
      letterElement.textContent = letter;

      wordElement.appendChild(letterElement);
      letterIndex += 1;
    });

    fragment.appendChild(wordElement);
  });

  line.textContent = "";
  line.appendChild(fragment);

  return letterIndex;
}

function getLetter(letters, index) {
  if (!letters.length) {
    return null;
  }

  return letters[index % letters.length];
}

function animateSmallJumps(gsap, letters, speed = 1, frequency = 1) {
  [
    { letter: getLetter(letters, 4), delay: 2.4 * frequency, repeatDelay: 9.5 * frequency },
    { letter: getLetter(letters, 18), delay: 6.8 * frequency, repeatDelay: 11.2 * frequency },
  ].forEach(({ letter, delay, repeatDelay }) => {
    if (!letter) return;

    gsap
      .timeline({
        repeat: -1,
        repeatDelay,
        delay,
      })
      .to(letter, {
        y: -8,
        duration: 0.26 * speed,
        ease: "power2.out",
      })
      .to(
        letter,
        {
          y: 0,
          duration: 0.5 * speed,
          ease: "power2.inOut",
        },
        "+=0.45",
      );
  });
}

function animateFlip(gsap, letters, speed = 1, frequency = 1) {
  const letter = getLetter(letters, 6);

  if (!letter) return;

  gsap
    .timeline({
      repeat: -1,
      repeatDelay: 12 * frequency,
      delay: 4.8 * frequency,
    })
    .to(letter, {
      rotationX: 180,
      duration: 0.48 * speed,
      ease: "power2.inOut",
    })
    .to(
      letter,
      {
        rotationX: 360,
        duration: 0.54 * speed,
        ease: "power2.inOut",
      },
      "+=0.16",
    )
    .set(letter, {
      rotationX: 0,
    });
}

function animateWobble(gsap, letters, speed = 1, frequency = 1) {
  const letter = getLetter(letters, 13);

  if (!letter) return;

  gsap
    .timeline({
      repeat: -1,
      repeatDelay: 10.5 * frequency,
      delay: 8.2 * frequency,
    })
    .to(letter, {
      rotation: -6,
      y: -3,
      duration: 0.28 * speed,
      ease: "power1.out",
    })
    .to(letter, {
      rotation: 5,
      y: 1,
      duration: 0.34 * speed,
      ease: "power1.inOut",
    })
    .to(letter, {
      rotation: -2,
      y: 0,
      duration: 0.28 * speed,
      ease: "power1.inOut",
    })
    .to(letter, {
      rotation: 0,
      y: 0,
      duration: 0.42 * speed,
      ease: "power2.out",
    });
}

function animateStretch(gsap, letters, speed = 1, frequency = 1) {
  const letter = getLetter(letters, 22);

  if (!letter) return;

  gsap
    .timeline({
      repeat: -1,
      repeatDelay: 13.5 * frequency,
      delay: 12.4 * frequency,
    })
    .to(letter, {
      scaleX: 1.16,
      scaleY: 0.92,
      duration: 0.36 * speed,
      ease: "power2.out",
    })
    .to(
      letter,
      {
        scaleX: 1,
        scaleY: 1,
        duration: 0.52 * speed,
        ease: "power2.inOut",
      },
      "+=0.08",
    );
}

function animateHeroLetters(title) {
  const gsap = getGsap();

  if (!gsap || window.matchMedia(REDUCED_MOTION_QUERY).matches) {
    return;
  }

  const letters = [...title.querySelectorAll(LETTER_SELECTOR)];

  if (!letters.length) {
    return;
  }

  gsap.set(letters, {
    color: LETTER_COLOR,
    transformOrigin: "50% 58%",
    transformPerspective: 900,
    force3D: true,
  });

  animateSmallJumps(gsap, letters);
  animateFlip(gsap, letters);
  animateWobble(gsap, letters);
  animateStretch(gsap, letters);
}

function getAvailableWidth(title) {
  const wrap = title.closest(".hero__headline-wrap") || title;
  const rect = wrap.getBoundingClientRect();
  const width = rect.width || wrap.clientWidth || window.innerWidth;

  return Math.max(0, Math.floor(width - FIT_SAFE_GAP));
}

function fitLine(line, availableWidth) {
  line.style.fontSize = "";
  line.classList.remove("is-hero-title-fitted");

  const style = window.getComputedStyle(line);
  const baseFontSize = Number.parseFloat(style.fontSize);

  if (!Number.isFinite(baseFontSize) || baseFontSize <= 0) {
    return;
  }

  const widestWord = [...line.querySelectorAll(".hero-title-word")].reduce(
    (max, word) => Math.max(max, Math.ceil(word.scrollWidth)),
    0,
  );

  if (!widestWord || widestWord <= availableWidth) {
    return;
  }

  const scale = availableWidth / widestWord;
  const nextFontSize = Math.max(FIT_MIN_FONT_SIZE, Math.floor(baseFontSize * scale * 1000) / 1000);

  line.style.fontSize = String(nextFontSize) + "px";
  line.classList.add("is-hero-title-fitted");
}

function fitHeroTitle(title, lines) {
  const availableWidth = getAvailableWidth(title);

  if (!availableWidth) {
    return;
  }

  lines.forEach((line) => fitLine(line, availableWidth));
}

function bindHeroTitleFit(title, lines) {
  let frame = 0;
  const wrap = title.closest(".hero__headline-wrap") || title;

  const scheduleFit = () => {
    if (frame) {
      return;
    }

    frame = window.requestAnimationFrame(() => {
      frame = 0;
      fitHeroTitle(title, lines);
    });
  };

  scheduleFit();

  document.fonts?.ready?.then(scheduleFit).catch(() => {});

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(scheduleFit);
    observer.observe(wrap);
  }

  window.addEventListener("resize", scheduleFit, { passive: true });
  window.addEventListener("orientationchange", scheduleFit, { passive: true });
}

export function initHeroTitleAnimation(root = document) {
  const title = root.querySelector(TITLE_SELECTOR);

  if (!title || title.dataset.heroTitleMounted === "true") {
    return null;
  }

  const lines = [...title.querySelectorAll(LINE_SELECTOR)];

  if (!lines.length) {
    return null;
  }

  let letterIndex = 0;

  title.dataset.heroTitleMounted = "true";
  title.setAttribute("aria-label", lines.map((line) => line.textContent.trim()).join(" "));

  lines.forEach((line) => {
    line.setAttribute("aria-hidden", "true");
    letterIndex = wrapLineLetters(line, letterIndex);
  });

  bindHeroTitleFit(title, lines);
  title.classList.add("is-hero-title-ready");
  animateHeroLetters(title);

  return title;
}
