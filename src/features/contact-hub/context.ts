import type { ContactHubEntryPoint, ContactHubMode } from "./state.ts";

export interface ContactContext {
  currentPath: string;
  language: "ru" | "en";
  entryPoint: ContactHubEntryPoint;
  activeMode: ContactHubMode;
}

const entryPoints = new Set<ContactHubEntryPoint>([
  "pet",
  "pet-direct",
  "site-contact",
  "collapsed-launcher",
]);

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function requireLanguage(value: unknown): ContactContext["language"] {
  if (value === "ru" || value === "en") return value;
  throw new TypeError("language must be ru or en");
}

function requireEntryPoint(value: unknown): ContactHubEntryPoint {
  if (typeof value === "string" && entryPoints.has(value as ContactHubEntryPoint)) {
    return value as ContactHubEntryPoint;
  }
  throw new TypeError("entryPoint is invalid");
}

function requireMode(value: unknown): ContactHubMode {
  if (value === "ai" || value === "form") return value;
  throw new TypeError("activeMode must be ai or form");
}

export function buildSharedContactContext(input: Record<string, unknown>): ContactContext {
  return {
    currentPath: requireString(input.currentPath, "currentPath"),
    language: requireLanguage(input.language),
    entryPoint: requireEntryPoint(input.entryPoint),
    activeMode: requireMode(input.activeMode),
  };
}
