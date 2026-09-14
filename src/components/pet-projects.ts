type Destroy = () => void;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function supportsScrollStateQueries(): boolean {
  return typeof CSS !== "undefined" && CSS.supports?.("container-type: scroll-state") === true;
}

function markActiveCard(
  cards: readonly HTMLElement[],
  next: HTMLElement | undefined,
): void {
  cards.forEach((card) => {
    if (card === next) card.dataset.active = "true";
    else delete card.dataset.active;
  });
}

function createFallbackActiveCardObserver(reel: HTMLElement, cards: readonly HTMLElement[]): Destroy {
  if (!cards.length) return () => {};

  if (typeof IntersectionObserver !== "function") {
    markActiveCard(cards, cards[0]);
    return () => {};
  }

  const ratios = new Map<HTMLElement, number>(cards.map((card) => [card, 0]));
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.target instanceof HTMLElement) ratios.set(entry.target, entry.intersectionRatio);
      });

      let active = cards[0];
      let activeRatio = -1;
      cards.forEach((card) => {
        const ratio = ratios.get(card) ?? 0;
        if (ratio > activeRatio) {
          active = card;
          activeRatio = ratio;
        }
      });
      markActiveCard(cards, active);
    },
    {
      root: reel,
      threshold: [0, 0.25, 0.5, 0.7, 0.85, 1],
    },
  );

  cards.forEach((card) => observer.observe(card));
  return () => observer.disconnect();
}

export function createPetProjectReels(root: ParentNode = document): Destroy {
  const destroys: Destroy[] = [];

  root.querySelectorAll<HTMLElement>("[data-pet-projects-reel]").forEach((reel) => {
    const cards = [...reel.querySelectorAll<HTMLElement>(".pet-project-card")];
    if (!cards.length) return;

    if (!supportsScrollStateQueries()) {
      destroys.push(createFallbackActiveCardObserver(reel, cards));
    }

    const handleFocusIn = (event: FocusEvent): void => {
      const target = event.target instanceof Element ? event.target : null;
      const card = target?.closest<HTMLElement>(".pet-project-card");
      if (!card || !reel.contains(card)) return;

      card.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
    };

    reel.addEventListener("focusin", handleFocusIn);
    destroys.push(() => reel.removeEventListener("focusin", handleFocusIn));
  });

  return () => destroys.splice(0).reverse().forEach((destroy) => destroy());
}
