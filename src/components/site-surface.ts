export type SiteSurface = "light" | "dark";

const STORAGE_PREFIX = "looksawful:surface:v1:";
const noop = () => {};

function isSiteSurface(value: string | undefined | null): value is SiteSurface {
  return value === "light" || value === "dark";
}

function getStorageKey(body: HTMLElement, target: Window): string {
  const pageId = body.dataset.pageId?.trim();
  const identity = pageId || target.location.pathname || "page";
  return `${STORAGE_PREFIX}${identity}`;
}

function readStoredSurface(target: Window, key: string): SiteSurface | null {
  try {
    const value = target.localStorage.getItem(key);
    return isSiteSurface(value) ? value : null;
  } catch {
    return null;
  }
}

function storeSurface(target: Window, key: string, surface: SiteSurface): void {
  try {
    target.localStorage.setItem(key, surface);
  } catch {
    // Storage may be unavailable; the in-session toggle still works.
  }
}

function nextSurface(surface: SiteSurface): SiteSurface {
  return surface === "light" ? "dark" : "light";
}

function labelFor(surface: SiteSurface): string {
  return surface === "light" ? "Включить тёмный фон" : "Включить светлый фон";
}

export function initSiteSurface(root: Document | HTMLElement = document): () => void {
  const doc = root instanceof Document ? root : root.ownerDocument;
  const body = doc.body;
  const target = doc.defaultView;
  const toggle = root.querySelector<HTMLButtonElement>("[data-surface-toggle]");
  if (!body || !target || !(toggle instanceof HTMLButtonElement)) return noop;

  const fallback = isSiteSurface(body.dataset.surfaceDefault)
    ? body.dataset.surfaceDefault
    : "light";
  const key = getStorageKey(body, target);
  let surface = readStoredSurface(target, key) ?? fallback;

  const apply = (next: SiteSurface): void => {
    surface = next;
    body.dataset.surface = next;
    doc.documentElement.dataset.surface = next;
    toggle.setAttribute("aria-pressed", String(next === "dark"));
    toggle.setAttribute("aria-label", labelFor(next));
  };

  const onToggle = (): void => {
    const next = nextSurface(surface);
    apply(next);
    storeSurface(target, key, next);
  };

  apply(surface);
  toggle.addEventListener("click", onToggle);

  return () => toggle.removeEventListener("click", onToggle);
}
