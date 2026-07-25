import { gsap } from "gsap";

const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

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
    .set(letter, { rotationX: 0 });
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

export function createHeroTitleMotion(root) {
  const media = gsap.matchMedia();
  const context = gsap.context(() => {
    media.add(MOTION_QUERY, () => {
      const letters = Array.from(root.querySelectorAll("[data-hero-letter]"));

      if (!letters.length) {
        return undefined;
      }

      const animatedLetters = LETTER_EVENTS.map(
        ({ index }) => letters[Math.abs(Math.trunc(index)) % letters.length],
      );

      gsap.set(animatedLetters, {
        transformOrigin: "50% 58%",
        transformPerspective: 900,
        force3D: true,
        willChange: "transform",
      });

      const timelines = LETTER_EVENTS.map((event) =>
        createLetterTimeline(letters, event),
      );

      let observer = null;

      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
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
            rootMargin: "18% 0px",
            threshold: 0,
          },
        );

        observer.observe(root);
      } else {
        timelines.forEach((timeline) => timeline.play());
      }

      return () => {
        observer?.disconnect();
        timelines.forEach((timeline) => timeline.kill());
        gsap.set(animatedLetters, {
          clearProps: "transform,willChange",
        });
      };
    });
  }, root);

  return () => {
    media.revert();
    context.revert();
  };
}
