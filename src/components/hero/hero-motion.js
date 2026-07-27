import { gsap } from "gsap";

const LETTER_EVENTS = [
  {
    type: "jump",
    index: 4,
    delay: 2.4,
    repeatDelay: 9.5,
    y: -8,
  },
  {
    type: "jump",
    index: 18,
    delay: 6.8,
    repeatDelay: 11.2,
    y: -8,
  },
  {
    type: "flip",
    index: 6,
    delay: 4.8,
    repeatDelay: 12,
  },
  {
    type: "wobble",
    index: 13,
    delay: 8.2,
    repeatDelay: 10.5,
    rotation: 6,
    y: -3,
  },
  {
    type: "stretch",
    index: 22,
    delay: 12.4,
    repeatDelay: 13.5,
    scaleX: 1.16,
    scaleY: 0.92,
  },
];

function appendJump(timeline, letter, event) {
  timeline
    .to(letter, {
      y: event.y ?? -6,
      duration: 0.2,
      ease: "power2.out",
    })
    .to(
      letter,
      {
        y: 0,
        duration: 0.42,
        ease: "power2.inOut",
      },
      "+=0.28",
    );
}

function appendFlip(timeline, letter) {
  timeline
    .to(letter, {
      rotationX: 180,
      duration: 0.4,
      ease: "power2.inOut",
    })
    .to(
      letter,
      {
        rotationX: 360,
        duration: 0.46,
        ease: "power2.inOut",
      },
      "+=0.12",
    )
    .set(letter, {
      rotationX: 0,
    });
}

function appendWobble(timeline, letter, event) {
  const rotation = event.rotation ?? 5;

  const y = event.y ?? -2;

  timeline
    .to(letter, {
      rotation: -rotation,
      y,
      duration: 0.23,
      ease: "power1.out",
    })
    .to(letter, {
      rotation: rotation * 0.84,

      y: 1,
      duration: 0.28,
      ease: "power1.inOut",
    })
    .to(letter, {
      rotation: -rotation * 0.34,

      y: 0,
      duration: 0.24,
      ease: "power1.inOut",
    })
    .to(letter, {
      rotation: 0,
      y: 0,
      duration: 0.36,
      ease: "power2.out",
    });
}

function appendStretch(timeline, letter, event) {
  timeline
    .to(letter, {
      scaleX: event.scaleX ?? 1.08,

      scaleY: event.scaleY ?? 0.95,

      duration: 0.28,
      ease: "power2.out",
    })
    .to(
      letter,
      {
        scaleX: 1,
        scaleY: 1,
        duration: 0.44,
        ease: "power2.inOut",
      },
      "+=0.06",
    );
}

function createLetterTimeline(letters, event) {
  const letter = letters[Math.abs(Math.trunc(event.index)) % letters.length];

  const timeline = gsap.timeline({
    repeat: -1,

    repeatDelay: event.repeatDelay,

    delay: event.delay,
    paused: true,
  });

  switch (event.type) {
    case "flip":
      appendFlip(timeline, letter);
      break;

    case "wobble":
      appendWobble(timeline, letter, event);
      break;

    case "stretch":
      appendStretch(timeline, letter, event);
      break;

    default:
      appendJump(timeline, letter, event);
  }

  return timeline;
}

function createAnimation(root) {
  const letters = Array.from(root.querySelectorAll("[data-hero-letter]"));

  if (!letters.length) {
    return null;
  }

  const animatedLetters = LETTER_EVENTS.map(
    ({ index }) => letters[Math.abs(Math.trunc(index)) % letters.length],
  );

  const timelines = [];

  let observer = null;

  const context = gsap.context(() => {
    gsap.set(animatedLetters, {
      transformOrigin: "50% 58%",

      transformPerspective: 900,

      force3D: true,

      willChange: "transform",
    });

    for (const event of LETTER_EVENTS) {
      timelines.push(createLetterTimeline(letters, event));
    }
  }, root);

  const setPlayback = (active) => {
    for (const timeline of timelines) {
      if (active) {
        timeline.play();
      } else {
        timeline.pause();
      }
    }
  };

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      ([entry]) => {
        setPlayback(Boolean(entry?.isIntersecting));
      },
      {
        rootMargin: "18% 0px",
        threshold: 0,
      },
    );

    observer.observe(root);
  } else {
    setPlayback(true);
  }

  return () => {
    observer?.disconnect();

    for (const timeline of timelines) {
      timeline.kill();
    }

    context.revert();
  };
}

export function createHeroTitleMotion({ root, motion } = {}) {
  if (!(root instanceof HTMLElement)) {
    return null;
  }

  let destroyAnimation = null;

  const syncMotion = ({ allowed }) => {
    destroyAnimation?.();
    destroyAnimation = null;

    if (allowed) {
      destroyAnimation = createAnimation(root);
    }
  };

  const unsubscribeMotion =
    typeof motion?.subscribe === "function" ? motion.subscribe(syncMotion) : () => {};

  return () => {
    unsubscribeMotion();

    destroyAnimation?.();
    destroyAnimation = null;
  };
}
