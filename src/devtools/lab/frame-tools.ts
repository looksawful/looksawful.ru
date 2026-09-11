export interface FrameDebugState {
  outline: boolean;
  grid: boolean;
  inspect: boolean;
}

export interface InspectedElementSummary {
  selector: string;
  size: string;
  display: string;
  position: string;
  font: string;
  color: string;
  background: string;
}

const FRAME_DEBUG_STYLE_ID = "looksawful-lab-frame-debug-style";

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function canAccessFrameDocument(
  frame: HTMLIFrameElement,
  shellOrigin: string,
): boolean {
  const normalizedShellOrigin = normalizeOrigin(shellOrigin);
  if (normalizedShellOrigin === null) return false;

  try {
    const targetOrigin = new URL(frame.src, normalizedShellOrigin).origin;
    if (targetOrigin !== normalizedShellOrigin) return false;
    return frame.contentDocument !== null;
  } catch {
    return false;
  }
}

export function applyFrameDebugStyles(doc: Document, state: FrameDebugState): void {
  let style = doc.getElementById(FRAME_DEBUG_STYLE_ID) as HTMLStyleElement | null;
  if (style === null) {
    style = doc.createElement("style");
    style.id = FRAME_DEBUG_STYLE_ID;
    style.dataset.labOwned = "frame-debug";
    doc.head.append(style);
  }

  style.textContent = [
    state.outline
      ? "html[data-lab-outline] * { outline: 1px solid rgb(255 0 90 / .22) !important; outline-offset: -1px !important; }"
      : "",
    state.grid
      ? "html[data-lab-grid] body::after { content: ''; position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; background-image: linear-gradient(to right, rgb(255 0 90 / .12) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 0 90 / .08) 1px, transparent 1px); background-size: 8px 8px; }"
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  doc.documentElement.toggleAttribute("data-lab-outline", state.outline);
  doc.documentElement.toggleAttribute("data-lab-grid", state.grid);
}

function escapeCssIdentifier(value: string): string {
  const escape = globalThis.CSS?.escape;
  if (escape !== undefined) return escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
}

export function createElementSelector(element: Element): string {
  if (element.id) return `#${escapeCssIdentifier(element.id)}`;

  const parts: string[] = [];
  let current: Element | null = element;

  while (current !== null && current !== current.ownerDocument.body && parts.length < 5) {
    const currentElement: Element = current;
    let part = currentElement.tagName.toLowerCase();
    const classes = Array.from(currentElement.classList)
      .filter((name) => !name.startsWith("is-"))
      .slice(0, 2);

    if (classes.length > 0) {
      part += classes.map((name) => `.${escapeCssIdentifier(name)}`).join("");
    }

    const parentElement: Element | null = currentElement.parentElement;
    if (parentElement !== null) {
      const siblings: Element[] = Array.from(parentElement.children);
      const sameTagSiblings = siblings.filter(
        (sibling: Element) => sibling.tagName === currentElement.tagName,
      );
      if (sameTagSiblings.length > 1) {
        part += `:nth-of-type(${sameTagSiblings.indexOf(currentElement) + 1})`;
      }
    }

    parts.unshift(part);
    current = parentElement;
  }

  return parts.join(" > ");
}

export function summarizeElement(element: HTMLElement): InspectedElementSummary {
  const rect = element.getBoundingClientRect();
  const view = element.ownerDocument.defaultView;
  if (view === null) throw new Error("Element has no active document view");
  const computed = view.getComputedStyle(element);

  return {
    selector: createElementSelector(element),
    size: `${Math.round(rect.width)} × ${Math.round(rect.height)}`,
    display: computed.display,
    position: computed.position,
    font: `${computed.fontSize} / ${computed.lineHeight} · ${computed.fontFamily.split(",")[0] ?? ""}`,
    color: computed.color,
    background: computed.backgroundColor,
  };
}
