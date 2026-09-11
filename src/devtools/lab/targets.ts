export type LabTargetKind = "local" | "preview" | "production";

export interface LabTarget {
  id: string;
  label: string;
  kind: LabTargetKind;
  origin: string;
}

export interface LabTargetCapabilities {
  visual: true;
  inspectDom: boolean;
  injectScratchCss: boolean;
  privilegedBridge: false;
}

const PRODUCTION_ORIGIN = "https://www.looksawful.ru";

function normalizeHttpOrigin(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL origin`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${label} must use an HTTP(S) origin`);
  }

  return url.origin;
}

export function createLabTargets(input: {
  currentOrigin: string;
  previewOrigin?: string;
}): readonly LabTarget[] {
  const currentOrigin = normalizeHttpOrigin(input.currentOrigin, "current origin");
  const targets: LabTarget[] = [
    {
      id: "local",
      label: "Local",
      kind: "local",
      origin: currentOrigin,
    },
  ];

  if (input.previewOrigin !== undefined) {
    targets.push({
      id: "preview",
      label: "PR Preview",
      kind: "preview",
      origin: normalizeHttpOrigin(input.previewOrigin, "preview origin"),
    });
  }

  targets.push({
    id: "production",
    label: "Production",
    kind: "production",
    origin: PRODUCTION_ORIGIN,
  });

  return targets;
}

export function getLabTargetCapabilities(
  target: LabTarget,
  shellOrigin: string,
): LabTargetCapabilities {
  const normalizedShellOrigin = normalizeHttpOrigin(shellOrigin, "shell origin");
  const sameOriginLocal =
    target.kind === "local" &&
    normalizeHttpOrigin(target.origin, "target origin") === normalizedShellOrigin;

  return {
    visual: true,
    inspectDom: sameOriginLocal,
    injectScratchCss: sameOriginLocal,
    privilegedBridge: false,
  };
}
