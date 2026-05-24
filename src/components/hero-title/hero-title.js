import { gsap } from "gsap";

const TITLE_SELECTOR = "#hero-title";
const LINE_SELECTOR = ".hero__title-name, .hero__title-role";
const COLOR_BASE = "#111111";

function wrapLineLetters(line) {
  const words = line.textContent.trim().split(/\s+/);
  const fragment = document.createDocumentFragment();
  let letterIndex = 0;

  words.forEach((word) => {
    const wordElement = document.createElement("span");
    wordElement.className = "hero-title-word";

    [...word].forEach((letter) => {
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
}

function getLetter(letters, index) {
  return letters[index % letters.length];
}

function createColorBursts(letters) {
  const accents = [
    { letter: getLetter(letters, 4), delay: 2.4, repeatDelay: 9.5 },
    { letter: getLetter(letters, 18), delay: 6.8, repeatDelay: 11.2 },
  ];

  accents.forEach(({ letter, delay, repeatDelay }) => {
    gsap
      .timeline({ repeat: -1, repeatDelay, delay })
      .to(letter, { y: -8, duration: 0.26, ease: "power2.out" })
      .to(letter, { y: 0, duration: 0.5, ease: "power2.inOut" }, "+=0.45");
  });
}

function createFlipAccent(letters) {
  const letter = getLetter(letters, 6);

  gsap
    .timeline({ repeat: -1, repeatDelay: 12, delay: 4.8 })
    .to(letter, { rotationX: 180, duration: 0.48, ease: "power2.inOut" })
    .to(letter, { rotationX: 360, duration: 0.54, ease: "power2.inOut" }, "+=0.16")
    .set(letter, { rotationX: 0 });
}

function createBalanceAccent(letters) {
  const letter = getLetter(letters, 13);

  gsap
    .timeline({ repeat: -1, repeatDelay: 10.5, delay: 8.2 })
    .to(letter, { rotation: -6, y: -3, duration: 0.28, ease: "power1.out" })
    .to(letter, { rotation: 5, y: 1, duration: 0.34, ease: "power1.inOut" })
    .to(letter, { rotation: -2, y: 0, duration: 0.28, ease: "power1.inOut" })
    .to(letter, { rotation: 0, y: 0, duration: 0.42, ease: "power2.out" });
}

function createStretchAccent(letters) {
  const letter = getLetter(letters, 22);

  gsap
    .timeline({ repeat: -1, repeatDelay: 13.5, delay: 12.4 })
    .to(letter, { scaleX: 1.16, scaleY: 0.92, duration: 0.36, ease: "power2.out" })
    .to(letter, { scaleX: 1, scaleY: 1, duration: 0.52, ease: "power2.inOut" }, "+=0.08");
}

export function initHeroTitleAnimation() {
  const title = document.querySelector(TITLE_SELECTOR);

  if (!title || title.dataset.heroTitleMounted === "true") {
    return;
  }

  const lines = [...title.querySelectorAll(LINE_SELECTOR)];

  if (!lines.length) {
    return;
  }

  title.dataset.heroTitleMounted = "true";
  title.setAttribute("aria-label", lines.map((line) => line.textContent.trim()).join(" "));

  lines.forEach((line) => {
    line.setAttribute("aria-hidden", "true");
    wrapLineLetters(line);
  });

  const letters = [...title.querySelectorAll(".hero-title-letter")];

  if (!letters.length) {
    return;
  }

  gsap.set(letters, {
    color: COLOR_BASE,
    transformOrigin: "50% 58%",
    transformPerspective: 900,
  });

  createColorBursts(letters);
  createFlipAccent(letters);
  createBalanceAccent(letters);
  createStretchAccent(letters);
}
