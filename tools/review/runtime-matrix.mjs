const REVIEW_DEPTHS = new Set(["quick", "interactive", "full"]);
const MOTION_VALUES = new Set(["no-preference", "reduce"]);
const DYNAMIC_KINDS = new Set(["video", "canvas", "webgl", "infinite-gallery"]);
const REVIEW_STATE_ATTRIBUTE = /^data-[a-z0-9][a-z0-9-]*$/u;

function freezeProfile(profile) {
  return Object.freeze(profile);
}

// Mobile/tablet dimensions deliberately reuse existing repository review viewports.
// These are deterministic CSS review profiles, not claims of pixel-perfect hardware emulation.
export const CANONICAL_REVIEW_PROFILES = Object.freeze([
  freezeProfile({
    id: "iphone-17",
    label: "iPhone 17",
    width: 390,
    height: 844,
    apple: true,
    class: "phone",
  }),
  freezeProfile({
    id: "ipad-air-11-portrait",
    label: "iPad Air 11 portrait",
    width: 834,
    height: 1112,
    apple: true,
    class: "tablet",
  }),
  freezeProfile({
    id: "desktop-1440",
    label: "Desktop 1440×900",
    width: 1440,
    height: 900,
    apple: false,
    class: "desktop",
  }),
  freezeProfile({
    id: "ultrawide-3440",
    label: "Ultrawide 3440×1440",
    width: 3440,
    height: 1440,
    apple: false,
    class: "desktop",
  }),
]);

export const REVIEW_BROWSER_ROLES = Object.freeze({
  chromium: "canonical-baseline",
  webkit: "technical-smoke",
});

const PROFILE_BY_ID = new Map(
  CANONICAL_REVIEW_PROFILES.map((profile) => [profile.id, profile]),
);

function normalizeReviewDepth(reviewDepth) {
  if (!REVIEW_DEPTHS.has(reviewDepth)) {
    throw new Error(`Unsupported review depth: ${reviewDepth}`);
  }
  return reviewDepth;
}

function normalizeAffectedProfiles(affectedProfiles) {
  if (affectedProfiles === undefined || affectedProfiles === null) return [];
  if (!Array.isArray(affectedProfiles)) {
    throw new TypeError("affectedProfiles must be an array when provided");
  }

  const requested = new Set();
  for (const profileId of affectedProfiles) {
    if (!PROFILE_BY_ID.has(profileId)) {
      throw new Error(`Unknown review profile: ${profileId}`);
    }
    requested.add(profileId);
  }

  return CANONICAL_REVIEW_PROFILES
    .filter((profile) => requested.has(profile.id))
    .map((profile) => profile.id);
}

function selectedProfiles(reviewDepth, affectedProfiles) {
  const affected = normalizeAffectedProfiles(affectedProfiles);
  if (affected.length > 0) {
    return CANONICAL_REVIEW_PROFILES.filter((profile) => affected.includes(profile.id));
  }

  // #1091 currently routes Cases and depth, not viewport profiles. Until an
  // explicit profile router exists, missing profile input must fail safe.
  return [...CANONICAL_REVIEW_PROFILES];
}

function normalizeMotionDifference(motionDifference) {
  const value = motionDifference ?? {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("motionDifference must be an object when provided");
  }

  return {
    viewport: value.viewport === true,
    fullPage: value.fullPage === true,
  };
}

function matrixRow({
  phase,
  browser,
  profile,
  motion,
  deterministic,
  baseline,
  captureKinds = [],
}) {
  if (!MOTION_VALUES.has(motion)) {
    throw new Error(`Unsupported motion profile: ${motion}`);
  }

  return Object.freeze({
    phase,
    browser,
    browserRole: REVIEW_BROWSER_ROLES[browser] ?? "runtime-smoke",
    baseline,
    profileId: profile.id,
    width: profile.width,
    height: profile.height,
    motion,
    deterministic,
    captureKinds: Object.freeze([...captureKinds]),
  });
}

export function buildReviewRuntimeMatrix({
  reviewDepth,
  affectedProfiles,
  motionDifference,
} = {}) {
  const normalizedDepth = normalizeReviewDepth(reviewDepth);

  const profiles = selectedProfiles(normalizedDepth, affectedProfiles);
  const materialMotion = normalizeMotionDifference(motionDifference);
  const rows = [];

  for (const profile of profiles) {
    rows.push(
      matrixRow({
        phase: "capture",
        browser: "chromium",
        profile,
        motion: "no-preference",
        deterministic: true,
        baseline: true,
        captureKinds: ["viewport", "full-page"],
      }),
    );

    const reducedKinds = [];
    if (materialMotion.viewport) reducedKinds.push("viewport");
    if (materialMotion.fullPage) reducedKinds.push("full-page");
    if (reducedKinds.length > 0) {
      rows.push(
        matrixRow({
          phase: "capture",
          browser: "chromium",
          profile,
          motion: "reduce",
          deterministic: true,
          baseline: true,
          captureKinds: reducedKinds,
        }),
      );
    }
  }

  for (const profile of profiles) {
    rows.push(
      matrixRow({
        phase: "runtime-smoke",
        browser: "chromium",
        profile,
        motion: "no-preference",
        deterministic: false,
        baseline: false,
      }),
    );
  }

  if (normalizedDepth !== "quick") {
    for (const profile of CANONICAL_REVIEW_PROFILES.filter(({ apple }) => apple)) {
      rows.push(
        matrixRow({
          phase: "technical-smoke",
          browser: "webkit",
          profile,
          motion: "no-preference",
          deterministic: false,
          baseline: false,
        }),
      );
    }
  }

  return Object.freeze(rows);
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} must be a non-empty string`);
  }
  return value;
}

function attributeState(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must declare attribute and value`);
  }

  const attribute = nonEmptyString(value.attribute, `${label}.attribute`);
  if (!REVIEW_STATE_ATTRIBUTE.test(attribute)) {
    throw new TypeError(`${label}.attribute must be a data-* review-state attribute`);
  }

  return Object.freeze({
    attribute,
    value: nonEmptyString(value.value, `${label}.value`),
  });
}

export function validateDynamicReviewState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Dynamic review state must be an object");
  }

  const id = nonEmptyString(value.id, "dynamic state id");
  const kind = nonEmptyString(value.kind, "dynamic state kind");
  const selector = nonEmptyString(value.selector, "dynamic state selector");

  if (!DYNAMIC_KINDS.has(kind)) {
    throw new Error(`Unsupported dynamic review state kind: ${kind}`);
  }

  if (kind === "video") {
    if (!Number.isFinite(value.time) || value.time < 0) {
      throw new TypeError("Video review state requires a finite non-negative time");
    }
    return Object.freeze({ id, kind, selector, time: value.time });
  }

  if (!value.ready || !value.stable) {
    throw new TypeError(
      `${kind} review state requires explicit ready and stable attribute contracts`,
    );
  }

  return Object.freeze({
    id,
    kind,
    selector,
    ready: attributeState(value.ready, "ready"),
    stable: attributeState(value.stable, "stable"),
  });
}
