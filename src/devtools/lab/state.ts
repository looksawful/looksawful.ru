export type ViewportPreset = "fit" | "desktop" | "tablet" | "mobile";
export type StageBackground = "checker" | "light" | "dark";

export interface LabState {
  route: string;
  preset: ViewportPreset;
  width: number;
  height: number;
  background: StageBackground;
  outline: boolean;
  grid: boolean;
  inspect: boolean;
  targetId: string;
}

export const LAB_VIEWPORT_PRESETS = {
  desktop: { width: 1440, height: 1000 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
} as const;

const SYNTHETIC_ORIGIN = "https://looksawful-lab.invalid";
const MIN_WIDTH = 240;
const MAX_WIDTH = 3840;
const MIN_HEIGHT = 320;
const MAX_HEIGHT = 2400;

function parsePreset(value: string | null): ViewportPreset {
  return value === "fit" || value === "desktop" || value === "tablet" || value === "mobile"
    ? value
    : "desktop";
}

function parseBackground(value: string | null): StageBackground {
  return value === "checker" || value === "light" || value === "dark"
    ? value
    : "checker";
}

function parseDimension(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function parseTargetId(value: string | null): string {
  const trimmed = value?.trim() ?? "";
  return /^[a-z0-9][a-z0-9_-]*$/i.test(trimmed) ? trimmed : "local";
}

export function sanitizeLabRoute(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) {
    return "/";
  }

  const candidate = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  try {
    const url = new URL(candidate, SYNTHETIC_ORIGIN);
    if (url.origin !== SYNTHETIC_ORIGIN) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function parseLabState(search: string): LabState {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const preset = parsePreset(params.get("preset"));
  const presetSize = preset === "fit" ? LAB_VIEWPORT_PRESETS.desktop : LAB_VIEWPORT_PRESETS[preset];

  return {
    route: sanitizeLabRoute(params.get("route") ?? "/"),
    preset,
    width: parseDimension(params.get("w"), presetSize.width, MIN_WIDTH, MAX_WIDTH),
    height: parseDimension(params.get("h"), presetSize.height, MIN_HEIGHT, MAX_HEIGHT),
    background: parseBackground(params.get("bg")),
    outline: params.get("outline") === "1",
    grid: params.get("grid") === "1",
    inspect: params.get("inspect") === "1",
    targetId: parseTargetId(params.get("target")),
  };
}

export function serializeLabState(state: LabState): string {
  const params = new URLSearchParams();
  params.set("route", sanitizeLabRoute(state.route));
  params.set("preset", state.preset);
  params.set("w", String(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(state.width)))));
  params.set("h", String(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.round(state.height)))));
  params.set("bg", state.background);
  params.set("target", parseTargetId(state.targetId));

  if (state.outline) params.set("outline", "1");
  if (state.grid) params.set("grid", "1");
  if (state.inspect) params.set("inspect", "1");

  return `?${params.toString()}`;
}
