import cvJson from "../content/cv.json" with { type: "json" };

export const CV_EXPERIENCE_IDS = [
  "jestei",
  "styx",
  "illumihand",
  "madcow",
  "sensetique",
  "line",
  "berry",
  "ss",
  "olovo",
  "theatre",
  "soroka",
  "kursovoy",
  "ran",
  "progress",
  "ria",
] as const;

export type CvExperienceId = (typeof CV_EXPERIENCE_IDS)[number];

export interface CvExperienceVisibility {
  id: CvExperienceId;
  visible: boolean;
}

export interface CvContentData {
  experience: readonly CvExperienceVisibility[];
}

const experienceIds = new Set<string>(CV_EXPERIENCE_IDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseExperience(value: unknown, index: number): CvExperienceVisibility {
  const label = `cv.experience[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);

  const idValue = value.id;
  if (typeof idValue !== "string" || idValue.length === 0) {
    throw new Error(`${label}.id must be a non-empty string`);
  }
  if (!experienceIds.has(idValue)) {
    throw new Error(`unexpected CV experience id: ${idValue}`);
  }

  const id = CV_EXPERIENCE_IDS.find((candidate) => candidate === idValue);
  if (!id) throw new Error(`unexpected CV experience id: ${idValue}`);

  if (typeof value.visible !== "boolean") {
    throw new Error(`${label}.visible must be a boolean`);
  }

  return { id, visible: value.visible };
}

export function parseCvContent(value: unknown): CvContentData {
  if (!isRecord(value)) throw new Error("CV content must be an object");
  if (!Array.isArray(value.experience)) {
    throw new Error("CV content.experience must be an array");
  }

  const parsed = value.experience.map(parseExperience);
  const byId = new Map<CvExperienceId, CvExperienceVisibility>();

  for (const item of parsed) {
    if (byId.has(item.id)) throw new Error(`duplicate CV experience id: ${item.id}`);
    byId.set(item.id, item);
  }

  for (const expectedId of CV_EXPERIENCE_IDS) {
    if (!byId.has(expectedId)) {
      throw new Error(`missing required CV experience id: ${expectedId}`);
    }
  }

  if (parsed.length !== CV_EXPERIENCE_IDS.length) {
    throw new Error(
      `CV experience count must remain ${CV_EXPERIENCE_IDS.length}; got ${parsed.length}`,
    );
  }

  const experience = CV_EXPERIENCE_IDS.map((id) => {
    const item = byId.get(id);
    if (!item) throw new Error(`missing required CV experience id: ${id}`);
    return Object.freeze({ ...item });
  });

  return Object.freeze({ experience: Object.freeze(experience) });
}

const rawCvContent: unknown = cvJson;

export const cvContent = parseCvContent(rawCvContent);
