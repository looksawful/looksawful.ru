export const AWFUL_DECORATIVE_ANIMATION_POLICY = {
  "camera-pro-flash": { priority: 60, cooldownMs: 60_000, maxPlaybackMs: 1_520 },
  camera: { priority: 55, cooldownMs: 90_000, maxPlaybackMs: 1_040 },
  "phone-pacing": { priority: 50, cooldownMs: 30_000, maxPlaybackMs: 28_875 },
  flipchart: { priority: 49, cooldownMs: 120_000, maxPlaybackMs: 1_440 },
  "drawing-cross-legged": { priority: 45, cooldownMs: 120_000, maxPlaybackMs: 1_280 },
  "music-house-dance": { priority: 40, cooldownMs: 120_000, maxPlaybackMs: 4_640 },
  laptop: { priority: 30, cooldownMs: 45_000, maxPlaybackMs: 20_000 },
  coffee: { priority: 20, cooldownMs: 900_000, maxPlaybackMs: 1_080 },
  "sleep-cross-legged": { priority: 15, cooldownMs: 600_000, maxPlaybackMs: 9_150 },
} as const;

export type AwfulDecorativeAnimation = keyof typeof AWFUL_DECORATIVE_ANIMATION_POLICY;

const PROMPT_RULES: readonly [AwfulDecorativeAnimation, RegExp][] = [
  [
    "camera-pro-flash",
    /(?:фото|фотограф|камер|изображ|визуал|референс|портрет|photo|camera|image|visual)/iu,
  ],
  ["phone-pacing", /(?:телефон|звон|созвон|голосов|phone|call|voice)/iu],
  ["flipchart", /(?:план|архитектур|черт[её]ж|схем|проектир|roadmap|architecture|diagram|plan)/iu],
  [
    "drawing-cross-legged",
    /(?:рисов|эскиз|иллюстрац|макет|композиц|sketch|draw|illustrat|layout)/iu,
  ],
  ["music-house-dance", /(?:музык|наушник|песн|аудио|звук|music|headphone|audio|sound)/iu],
  ["sleep-cross-legged", /(?:спат|сон|отдых|sleep|nap|rest)/iu],
];

export function isAwfulDecorativeAnimation(value: unknown): value is AwfulDecorativeAnimation {
  return typeof value === "string" && Object.hasOwn(AWFUL_DECORATIVE_ANIMATION_POLICY, value);
}

export function resolveAwfulPromptAnimation(message: string): AwfulDecorativeAnimation | null {
  for (const [animation, pattern] of PROMPT_RULES) {
    if (pattern.test(message)) return animation;
  }
  return null;
}
