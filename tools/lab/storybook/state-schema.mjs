export const LOOKSAWFUL_STORY_LAYER_VALUES = Object.freeze([
  "foundation", "atom", "molecule", "organism", "template", "page", "motion", "experimental",
]);

export const LOOKSAWFUL_STORY_POLICY_VALUES = Object.freeze([
  "isolated", "composition", "page", "behavior-fixture", "experimental",
]);

export const LOOKSAWFUL_VISIBILITY_VALUES = Object.freeze([
  "always", "breakpoint", "conditional", "disclosure", "overlay", "data",
  "feature-or-experiment", "offscreen-or-virtualized", "input-capability",
]);

export const LOOKSAWFUL_INTERACTION_VALUES = Object.freeze([
  "default", "hover", "focus-visible", "active-or-pressed", "selected", "disabled", "open", "closed",
]);

export const LOOKSAWFUL_DATA_VALUES = Object.freeze([
  "loading", "ready", "empty", "error", "partial", "unavailable",
]);

export const LOOKSAWFUL_MOTION_VALUES = Object.freeze([
  "motion-enabled", "reduced-motion", "initial", "active", "settled", "exit",
]);

export const LOOKSAWFUL_REVIEW_VIEWPORT_VALUES = Object.freeze([
  "desktop", "tablet", "mobile",
]);

const ROOT_KEYS = new Set([
  "sources", "layer", "policy", "canonical", "state", "visibility",
  "interaction", "data", "motion", "responsive", "routeDiscovery",
]);
const RESPONSIVE_KEYS = new Set(["review", "conditions"]);
const ROUTE_DISCOVERY_KEYS = new Set(["listed", "indexable"]);
const STATE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(path, message) {
  throw new TypeError(`${path}: ${message}`);
}

function assertPlainObject(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(path, "must be an object");
}

function assertKnownKeys(value, allowed, path) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(path, `unknown key ${key}`);
  }
}

function assertEnum(value, allowed, path) {
  if (!allowed.includes(value)) fail(path, `must be one of: ${allowed.join(", ")}`);
}

function assertUniqueEnumArray(value, allowed, path, { required = false } = {}) {
  if (value === undefined && !required) return;
  if (!Array.isArray(value) || value.length === 0) fail(path, "must be a non-empty array");
  const seen = new Set();
  for (const item of value) {
    assertEnum(item, allowed, path);
    if (seen.has(item)) fail(path, `duplicate value ${item}`);
    seen.add(item);
  }
}

function assertSources(value) {
  if (!Array.isArray(value) || value.length === 0) fail("parameters.looksawful.sources", "must be a non-empty array");
  const seen = new Set();
  for (const source of value) {
    if (typeof source !== "string" || !source || source.startsWith("/") || source.includes("..") || source.includes("\\")) {
      fail("parameters.looksawful.sources", "entries must be repo-relative POSIX paths");
    }
    if (seen.has(source)) fail("parameters.looksawful.sources", `duplicate source ${source}`);
    seen.add(source);
  }
}

function assertResponsive(value) {
  if (value === undefined) return;
  assertPlainObject(value, "parameters.looksawful.responsive");
  assertKnownKeys(value, RESPONSIVE_KEYS, "parameters.looksawful.responsive");
  if (value.review !== undefined) {
    assertUniqueEnumArray(value.review, LOOKSAWFUL_REVIEW_VIEWPORT_VALUES, "parameters.looksawful.responsive.review");
  }
  if (value.conditions !== undefined) {
    if (!Array.isArray(value.conditions) || value.conditions.length === 0) fail("parameters.looksawful.responsive.conditions", "must be a non-empty array");
    const seen = new Set();
    for (const condition of value.conditions) {
      if (typeof condition !== "string" || condition.trim() === "") fail("parameters.looksawful.responsive.conditions", "entries must be non-empty strings");
      if (seen.has(condition)) fail("parameters.looksawful.responsive.conditions", `duplicate condition ${condition}`);
      seen.add(condition);
    }
  }
}

function assertRouteDiscovery(value) {
  if (value === undefined) return;
  assertPlainObject(value, "parameters.looksawful.routeDiscovery");
  assertKnownKeys(value, ROUTE_DISCOVERY_KEYS, "parameters.looksawful.routeDiscovery");
  for (const key of ROUTE_DISCOVERY_KEYS) {
    if (typeof value[key] !== "boolean") fail(`parameters.looksawful.routeDiscovery.${key}`, "must be boolean");
  }
}

export function validateLooksawfulStoryParameters(value) {
  assertPlainObject(value, "parameters.looksawful");
  assertKnownKeys(value, ROOT_KEYS, "parameters.looksawful");
  assertSources(value.sources);
  assertEnum(value.layer, LOOKSAWFUL_STORY_LAYER_VALUES, "parameters.looksawful.layer");
  assertEnum(value.policy, LOOKSAWFUL_STORY_POLICY_VALUES, "parameters.looksawful.policy");
  if (typeof value.canonical !== "boolean") fail("parameters.looksawful.canonical", "must be boolean");
  if (typeof value.state !== "string" || !STATE_SLUG.test(value.state)) fail("parameters.looksawful.state", "must be a lowercase kebab-case slug");
  assertUniqueEnumArray(value.visibility, LOOKSAWFUL_VISIBILITY_VALUES, "parameters.looksawful.visibility", { required: true });
  assertUniqueEnumArray(value.interaction, LOOKSAWFUL_INTERACTION_VALUES, "parameters.looksawful.interaction");
  assertUniqueEnumArray(value.data, LOOKSAWFUL_DATA_VALUES, "parameters.looksawful.data");
  assertUniqueEnumArray(value.motion, LOOKSAWFUL_MOTION_VALUES, "parameters.looksawful.motion");
  assertResponsive(value.responsive);
  assertRouteDiscovery(value.routeDiscovery);
  return true;
}
