export const LAB_SCRATCH_STORAGE_KEY = "looksawful:lab:scratch-css:v2";
export const LAB_SCRATCH_STYLE_ID = "looksawful-lab-scratch-style";

export function readScratchCss(storage: Pick<Storage, "getItem">): string {
  return storage.getItem(LAB_SCRATCH_STORAGE_KEY) ?? "";
}

export function writeScratchCss(
  storage: Pick<Storage, "setItem" | "removeItem">,
  value: string,
): void {
  if (value.length === 0) {
    storage.removeItem(LAB_SCRATCH_STORAGE_KEY);
    return;
  }

  storage.setItem(LAB_SCRATCH_STORAGE_KEY, value);
}

export function applyScratchCss(doc: Document, value: string): void {
  let style = doc.getElementById(LAB_SCRATCH_STYLE_ID) as HTMLStyleElement | null;

  if (style === null) {
    style = doc.createElement("style");
    style.id = LAB_SCRATCH_STYLE_ID;
    style.dataset.labOwned = "scratch-css";
    doc.head.append(style);
  }

  style.textContent = value;
}

export function resetScratchCss(
  doc: Document,
  storage: Pick<Storage, "removeItem">,
): void {
  storage.removeItem(LAB_SCRATCH_STORAGE_KEY);

  const style = doc.getElementById(LAB_SCRATCH_STYLE_ID);
  if (style instanceof HTMLElement) {
    style.remove();
    return;
  }

  style?.remove();
}
