import { escapeHtml } from "./utils/html.ts";

export const REVEAL_KINDS = [
  "copy",
  "media",
  "card",
] as const;

export type RevealKind = (typeof REVEAL_KINDS)[number];

export const REVEAL_ATTRIBUTE = "data-reveal";

export const REVEAL_GROUP_ATTRIBUTE = "data-reveal-group";

export const REVEAL_RAIL_ATTRIBUTE = "data-reveal-rail";

export function renderRevealAttribute(
  kind: RevealKind | false | undefined,
): string {
  return kind ? ` ${REVEAL_ATTRIBUTE}="${escapeHtml(kind)}"` : "";
}

export function renderRevealGroupAttribute(
  enabled: boolean | undefined = true,
): string {
  return enabled ? ` ${REVEAL_GROUP_ATTRIBUTE}=""` : "";
}

export function renderRevealRailAttribute(
  enabled: boolean | undefined = true,
): string {
  return enabled ? ` ${REVEAL_RAIL_ATTRIBUTE}=""` : "";
}
