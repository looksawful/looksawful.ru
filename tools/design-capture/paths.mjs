import path from "node:path";

function safeSegment(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.html$/i, "-html")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "") || "home";
}

export function pageSlug(route) {
  if (route === "/") return "home";
  return safeSegment(route.replaceAll("/", "--"));
}

export function pageCapturePath({ viewport, route, kind }) {
  return path.join("pages", viewport, `${pageSlug(route)}--${safeSegment(kind)}.png`);
}

export function componentCapturePath({ component, breakpoint, instance, side }) {
  const width = side === "before" ? breakpoint - 1 : breakpoint + 1;
  return path.join(
    "components",
    safeSegment(component),
    String(breakpoint),
    String(instance).padStart(3, "0"),
    `${safeSegment(side)}--${width}.png`,
  );
}

export function safeOutputPath(outputDir, relativePath) {
  const absoluteRoot = path.resolve(outputDir);
  const absolute = path.resolve(outputDir, relativePath);
  const relative = path.relative(absoluteRoot, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside design capture output: ${relativePath}`);
  }
  return absolute;
}
