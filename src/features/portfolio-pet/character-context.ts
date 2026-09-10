export type PortfolioPetCharacterId = "default" | "jestei" | "styx";

export interface PortfolioPetCharacterPrototype {
  id: PortfolioPetCharacterId;
  label: string;
  visualVariant: "editorial" | "signal" | "jewel";
}

export interface PortfolioPetCharacterContext {
  pageId?: string | null;
  activeSectionId?: string | null;
}

const prototypeCharacters: Readonly<Record<PortfolioPetCharacterId, PortfolioPetCharacterPrototype>> = Object.freeze({
  default: Object.freeze({ id: "default", label: "Portfolio", visualVariant: "editorial" }),
  jestei: Object.freeze({ id: "jestei", label: "Jestei Pool", visualVariant: "signal" }),
  styx: Object.freeze({ id: "styx", label: "Styx Jewel", visualVariant: "jewel" }),
});

const pageCharacters: Readonly<Record<string, PortfolioPetCharacterId>> = Object.freeze({
  "case:jestei-pool": "jestei",
  "case:styx": "styx",
});

const sectionCharacters: Readonly<Record<string, PortfolioPetCharacterId>> = Object.freeze({
  "project-jestei": "jestei",
  "project-styx": "styx",
});

export function getPortfolioPetPrototypeCharacters(): Readonly<Record<PortfolioPetCharacterId, PortfolioPetCharacterPrototype>> {
  return prototypeCharacters;
}

export function getPortfolioPetObservedSections(): readonly string[] {
  return Object.freeze(Object.keys(sectionCharacters));
}

export function resolvePortfolioPetCharacter({
  pageId,
  activeSectionId,
}: PortfolioPetCharacterContext): PortfolioPetCharacterId {
  if (activeSectionId && sectionCharacters[activeSectionId]) return sectionCharacters[activeSectionId];
  if (pageId && pageCharacters[pageId]) return pageCharacters[pageId];
  return "default";
}

export function inferPortfolioPetPageId(root: Document = document): string {
  return root.body?.dataset.pageId?.trim() || "home";
}

export interface PortfolioPetCharacterObserverOptions {
  root?: Document;
  pageId?: string;
  onChange: (characterId: PortfolioPetCharacterId) => void;
}

export interface PortfolioPetCharacterObserver {
  readonly current: PortfolioPetCharacterId;
  destroy(): void;
}

export function observePortfolioPetCharacter({
  root = document,
  pageId = inferPortfolioPetPageId(root),
  onChange,
}: PortfolioPetCharacterObserverOptions): PortfolioPetCharacterObserver {
  let current = resolvePortfolioPetCharacter({ pageId });
  const sectionRatios = new Map<string, number>();
  onChange(current);

  const setCurrent = (next: PortfolioPetCharacterId): void => {
    if (next === current) return;
    current = next;
    onChange(next);
  };

  const sections = getPortfolioPetObservedSections()
    .map((id) => root.getElementById(id))
    .filter((element): element is HTMLElement => element instanceof HTMLElement);

  if (!sections.length || typeof IntersectionObserver !== "function") {
    return {
      get current() {
        return current;
      },
      destroy() {},
    };
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!(entry.target instanceof HTMLElement)) continue;
      sectionRatios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
    }

    const activeSection = [...sectionRatios.entries()]
      .filter(([, ratio]) => ratio > 0)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    setCurrent(resolvePortfolioPetCharacter({ pageId, activeSectionId: activeSection }));
  }, {
    root: null,
    rootMargin: "-28% 0px -28% 0px",
    threshold: [0, 0.15, 0.35, 0.6, 1],
  });

  for (const section of sections) {
    sectionRatios.set(section.id, 0);
    observer.observe(section);
  }

  return {
    get current() {
      return current;
    },
    destroy(): void {
      observer.disconnect();
      sectionRatios.clear();
    },
  };
}
