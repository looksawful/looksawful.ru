import "./lab.css";

type ViewportPreset = "fit" | "desktop" | "tablet" | "mobile";
type StageBackground = "checker" | "light" | "dark";

type LabState = {
  route: string;
  preset: ViewportPreset;
  width: number;
  height: number;
  background: StageBackground;
  outline: boolean;
  grid: boolean;
  inspect: boolean;
};

const PRESETS: Record<Exclude<ViewportPreset, "fit">, { width: number; height: number }> = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Lab element: ${selector}`);
  return element;
}

const stage = required<HTMLElement>("[data-stage]");
const frameWrap = required<HTMLElement>("[data-frame-wrap]");
const frame = required<HTMLIFrameElement>("[data-preview-frame]");
const routeInput = required<HTMLInputElement>("[data-route-input]");
const widthInput = required<HTMLInputElement>("[data-width]");
const heightInput = required<HTMLInputElement>("[data-height]");
const outlineInput = required<HTMLInputElement>("[data-debug-outline]");
const gridInput = required<HTMLInputElement>("[data-debug-grid]");
const inspectInput = required<HTMLInputElement>("[data-debug-inspect]");
const status = required<HTMLElement>("[data-frame-status]");
const meta = required<HTMLElement>("[data-frame-meta]");
const openPage = required<HTMLAnchorElement>("[data-open-page]");
const inspectorEmpty = required<HTMLElement>("[data-inspector-empty]");
const inspectorData = required<HTMLElement>("[data-inspector-data]");
const copySelectorButton = required<HTMLButtonElement>("[data-action='copy-selector']");

const params = new URLSearchParams(location.search);

function sanitizeRoute(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "/";
  try {
    const url = new URL(trimmed, location.origin);
    if (url.origin !== location.origin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

function parsePreset(value: string | null): ViewportPreset {
  return value === "desktop" || value === "tablet" || value === "mobile" || value === "fit"
    ? value
    : "desktop";
}

function parseBackground(value: string | null): StageBackground {
  return value === "light" || value === "dark" || value === "checker" ? value : "checker";
}

function parseDimension(value: string | null, fallback: number, min: number, max: number): number {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

const initialPreset = parsePreset(params.get("preset"));
const presetSize = initialPreset === "fit" ? PRESETS.desktop : PRESETS[initialPreset];

const state: LabState = {
  route: sanitizeRoute(params.get("route") ?? "/"),
  preset: initialPreset,
  width: parseDimension(params.get("w"), presetSize.width, 240, 3840),
  height: parseDimension(params.get("h"), presetSize.height, 320, 2400),
  background: parseBackground(params.get("bg")),
  outline: params.get("outline") === "1",
  grid: params.get("grid") === "1",
  inspect: params.get("inspect") === "1",
};

let selectedSelector = "";
let hoveredElement: HTMLElement | null = null;
let inspectedElement: HTMLElement | null = null;
let boundDocument: Document | null = null;

const debugStyleId = "looksawful-lab-debug-style";
const inspectionStyleId = "looksawful-lab-inspection-style";

function writeStateToUrl(): void {
  const next = new URL(location.href);
  next.searchParams.set("route", state.route);
  next.searchParams.set("preset", state.preset);
  next.searchParams.set("w", String(state.width));
  next.searchParams.set("h", String(state.height));
  next.searchParams.set("bg", state.background);
  state.outline ? next.searchParams.set("outline", "1") : next.searchParams.delete("outline");
  state.grid ? next.searchParams.set("grid", "1") : next.searchParams.delete("grid");
  state.inspect ? next.searchParams.set("inspect", "1") : next.searchParams.delete("inspect");
  history.replaceState(null, "", next);
}

function setPressed(selector: string, attribute: string, value: string): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(selector)) {
    button.setAttribute("aria-pressed", String(button.dataset[attribute] === value));
  }
}

function updateRouteSelection(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-route]")) {
    if (button.dataset.route === state.route) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
}

function renderControls(): void {
  routeInput.value = state.route;
  widthInput.value = String(state.width);
  heightInput.value = String(state.height);
  outlineInput.checked = state.outline;
  gridInput.checked = state.grid;
  inspectInput.checked = state.inspect;
  stage.dataset.background = state.background;
  openPage.href = state.route;
  setPressed("[data-preset]", "preset", state.preset);
  setPressed("[data-bg]", "bg", state.background);
  updateRouteSelection();
}

function scaleFrame(): void {
  const rect = stage.getBoundingClientRect();
  const gap = 28;
  const availableWidth = Math.max(1, rect.width - gap * 2);
  const availableHeight = Math.max(1, rect.height - gap * 2);
  const naturalWidth = state.width;
  const naturalHeight = state.height;
  const scale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);

  frameWrap.style.width = `${naturalWidth}px`;
  frameWrap.style.height = `${naturalHeight}px`;
  frameWrap.style.transform = `translate(-50%, -50%) scale(${scale})`;
  meta.textContent = `${naturalWidth} × ${naturalHeight} · ${Math.round(scale * 100)}%`;
}

function setStatus(value: string, kind: "loading" | "ready" | "error" = "loading"): void {
  status.textContent = value;
  status.dataset.state = kind;
}

function ensureDebugStyles(doc: Document): void {
  let style = doc.getElementById(debugStyleId) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = debugStyleId;
    doc.head.append(style);
  }

  style.textContent = [
    state.outline ? "html[data-lab-outline='1'] * { outline: 1px solid rgb(255 0 90 / .22) !important; outline-offset: -1px !important; }" : "",
    state.grid ? "html[data-lab-grid='1'] body::after { content: ''; position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; background-image: linear-gradient(to right, rgb(255 0 90 / .12) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 0 90 / .08) 1px, transparent 1px); background-size: 8px 8px; }" : "",
  ].filter(Boolean).join("\n");

  doc.documentElement.dataset.labOutline = state.outline ? "1" : "0";
  doc.documentElement.dataset.labGrid = state.grid ? "1" : "0";
}

function elementSelector(element: Element): string {
  if (element.id) return `#${CSS.escape(element.id)}`;

  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== current.ownerDocument.body && parts.length < 5) {
    let part = current.tagName.toLowerCase();
    const classNames = Array.from(current.classList)
      .filter((name) => !name.startsWith("is-"))
      .slice(0, 2);
    if (classNames.length) part += classNames.map((name) => `.${CSS.escape(name)}`).join("");

    const currentElement: Element = current;
    const parentElement: Element | null = currentElement.parentElement;
    if (parentElement) {
      const siblings: Element[] = Array.from(parentElement.children).filter(
        (sibling: Element) => sibling.tagName === currentElement.tagName,
      );
      if (siblings.length > 1) {
        part += `:nth-of-type(${siblings.indexOf(currentElement) + 1})`;
      }
    }

    parts.unshift(part);
    current = parentElement;
  }
  return parts.join(" > ");
}

function clearInspectionVisuals(): void {
  if (hoveredElement) hoveredElement.removeAttribute("data-lab-hovered");
  if (inspectedElement) inspectedElement.removeAttribute("data-lab-selected");
  hoveredElement = null;
}

function ensureInspectionStyle(doc: Document): void {
  let style = doc.getElementById(inspectionStyleId) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = inspectionStyleId;
    style.textContent = `
      [data-lab-hovered] { outline: 2px solid #ff005a !important; outline-offset: 2px !important; }
      [data-lab-selected] { outline: 2px solid #00a8ff !important; outline-offset: 2px !important; }
    `;
    doc.head.append(style);
  }
}

function renderInspection(element: HTMLElement): void {
  inspectedElement?.removeAttribute("data-lab-selected");
  inspectedElement = element;
  inspectedElement.setAttribute("data-lab-selected", "");
  selectedSelector = elementSelector(element);
  const rect = element.getBoundingClientRect();
  const computed = getComputedStyle(element);
  const values: Record<string, string> = {
    selector: selectedSelector,
    size: `${Math.round(rect.width)} × ${Math.round(rect.height)}`,
    display: computed.display,
    position: computed.position,
    font: `${computed.fontSize} / ${computed.lineHeight} · ${computed.fontFamily.split(",")[0]}`,
    color: computed.color,
    background: computed.backgroundColor,
  };

  for (const [key, value] of Object.entries(values)) {
    const target = document.querySelector<HTMLElement>(`[data-inspect='${key}']`);
    if (target) target.textContent = value;
  }

  inspectorEmpty.hidden = true;
  inspectorData.hidden = false;
  copySelectorButton.disabled = false;
}

function inspectMouseMove(event: MouseEvent): void {
  if (!state.inspect) return;
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target || target === hoveredElement) return;
  hoveredElement?.removeAttribute("data-lab-hovered");
  hoveredElement = target;
  hoveredElement.setAttribute("data-lab-hovered", "");
}

function inspectClick(event: MouseEvent): void {
  if (!state.inspect) return;
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  event.preventDefault();
  event.stopPropagation();
  renderInspection(target);
}

function bindInspection(doc: Document): void {
  if (boundDocument === doc) return;
  if (boundDocument) {
    boundDocument.removeEventListener("mousemove", inspectMouseMove, true);
    boundDocument.removeEventListener("click", inspectClick, true);
  }
  boundDocument = doc;
  ensureInspectionStyle(doc);
  doc.addEventListener("mousemove", inspectMouseMove, true);
  doc.addEventListener("click", inspectClick, true);
}

function applyFrameTools(): void {
  try {
    const doc = frame.contentDocument;
    if (!doc) throw new Error("frame document unavailable");
    ensureDebugStyles(doc);
    bindInspection(doc);
    if (!state.inspect) clearInspectionVisuals();
  } catch {
    setStatus("preview loaded, inspection unavailable", "error");
  }
}

function navigate(route: string): void {
  state.route = sanitizeRoute(route);
  routeInput.value = state.route;
  openPage.href = state.route;
  setStatus("loading", "loading");
  frame.src = state.route;
  updateRouteSelection();
  writeStateToUrl();
}

function setPreset(preset: ViewportPreset): void {
  state.preset = preset;
  if (preset !== "fit") {
    state.width = PRESETS[preset].width;
    state.height = PRESETS[preset].height;
  }
  renderControls();
  scaleFrame();
  writeStateToUrl();
}

function setDimensions(): void {
  state.width = parseDimension(widthInput.value, state.width, 240, 3840);
  state.height = parseDimension(heightInput.value, state.height, 320, 2400);
  state.preset = "fit";
  renderControls();
  scaleFrame();
  writeStateToUrl();
}

async function copyText(value: string, button?: HTMLButtonElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    if (button) {
      const label = button.textContent;
      button.textContent = "copied";
      window.setTimeout(() => { button.textContent = label; }, 900);
    }
  } catch {
    setStatus("clipboard unavailable", "error");
  }
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-route]")) {
  button.addEventListener("click", () => navigate(button.dataset.route ?? "/"));
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
  button.addEventListener("click", () => setPreset(parsePreset(button.dataset.preset ?? "fit")));
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-bg]")) {
  button.addEventListener("click", () => {
    state.background = parseBackground(button.dataset.bg ?? "checker");
    renderControls();
    writeStateToUrl();
  });
}

required<HTMLButtonElement>("[data-action='go']").addEventListener("click", () => navigate(routeInput.value));
required<HTMLButtonElement>("[data-action='reload']").addEventListener("click", () => {
  setStatus("loading", "loading");
  frame.contentWindow?.location.reload();
});
required<HTMLButtonElement>("[data-action='copy-view']").addEventListener("click", (event) => {
  void copyText(location.href, event.currentTarget as HTMLButtonElement);
});
copySelectorButton.addEventListener("click", (event) => {
  if (selectedSelector) void copyText(selectedSelector, event.currentTarget as HTMLButtonElement);
});

routeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") navigate(routeInput.value);
});
widthInput.addEventListener("change", setDimensions);
heightInput.addEventListener("change", setDimensions);

outlineInput.addEventListener("change", () => {
  state.outline = outlineInput.checked;
  applyFrameTools();
  writeStateToUrl();
});
gridInput.addEventListener("change", () => {
  state.grid = gridInput.checked;
  applyFrameTools();
  writeStateToUrl();
});
inspectInput.addEventListener("change", () => {
  state.inspect = inspectInput.checked;
  applyFrameTools();
  writeStateToUrl();
});

frame.addEventListener("load", () => {
  setStatus("ready", "ready");
  try {
    const current = frame.contentWindow?.location;
    if (current && current.origin === location.origin) {
      state.route = `${current.pathname}${current.search}${current.hash}`;
      renderControls();
      writeStateToUrl();
    }
  } catch {
    // Cross-origin navigation is intentionally tolerated; inspection will be disabled.
  }
  applyFrameTools();
});

new ResizeObserver(scaleFrame).observe(stage);

window.addEventListener("keydown", (event) => {
  const target = event.target;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  if (event.key === "1") setPreset("desktop");
  else if (event.key === "2") setPreset("tablet");
  else if (event.key === "3") setPreset("mobile");
  else if (event.key.toLowerCase() === "f") setPreset("fit");
  else if (event.key.toLowerCase() === "r") frame.contentWindow?.location.reload();
  else if (event.key.toLowerCase() === "i") {
    state.inspect = !state.inspect;
    renderControls();
    applyFrameTools();
    writeStateToUrl();
  }
});

renderControls();
scaleFrame();
navigate(state.route);
