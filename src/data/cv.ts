import cvJson from "../content/cv.json" with { type: "json" };

export const CV_PRINCIPLE_IDS = [
  "visual",
  "communication",
  "product",
  "new-products",
  "leadership",
] as const;

export const CV_LANGUAGE_IDS = ["english", "czech"] as const;

export const CV_SKILL_SECTION_IDS = ["hard", "tech", "soft", "tools"] as const;

export const CV_SKILL_ROW_IDS = {
  hard: [
    "identity",
    "direction",
    "product",
    "communications",
    "motion",
    "graphic",
    "generative",
    "production",
  ],
  tech: [
    "code",
    "graphics",
    "design-systems",
    "color",
    "automation",
    "generative",
  ],
  soft: [
    "leader",
    "researcher",
    "teacher",
    "negotiator",
    "multitasking",
    "responsible",
  ],
  tools: [
    "design",
    "code",
    "tests",
    "audio",
    "color",
    "shootings",
    "editing",
    "ai",
    "utilities",
  ],
} as const;

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

export type CvPrincipleId = (typeof CV_PRINCIPLE_IDS)[number];
export type CvLanguageId = (typeof CV_LANGUAGE_IDS)[number];
export type CvSkillSectionId = (typeof CV_SKILL_SECTION_IDS)[number];
export type CvSkillRowId = (typeof CV_SKILL_ROW_IDS)[CvSkillSectionId][number];
export type CvExperienceId = (typeof CV_EXPERIENCE_IDS)[number];

export interface CvProfilePrinciple {
  id: CvPrincipleId;
  title: string;
  text: string;
}

export interface CvLanguage {
  id: CvLanguageId;
  name: string;
  level: string;
}

export interface CvProfileData {
  name: string;
  role: string;
  aboutPrimary: string;
  aboutSecondary: string;
  principles: readonly CvProfilePrinciple[];
  languages: readonly CvLanguage[];
}

export interface CvSkillRowData {
  id: CvSkillRowId;
  label: string;
  text: string;
}

export interface CvSkillSectionData {
  title: string;
  rows: readonly CvSkillRowData[];
}

export interface CvSkillsData {
  hard: CvSkillSectionData;
  tech: CvSkillSectionData;
  soft: CvSkillSectionData;
  tools: CvSkillSectionData;
}

export interface CvExperienceVisibility {
  id: CvExperienceId;
  visible: boolean;
}

export interface CvContentData {
  profile: CvProfileData;
  skills: CvSkillsData;
  experience: readonly CvExperienceVisibility[];
}

const principleIds = new Set<string>(CV_PRINCIPLE_IDS);
const languageIds = new Set<string>(CV_LANGUAGE_IDS);
const experienceIds = new Set<string>(CV_EXPERIENCE_IDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(
  record: Record<string, unknown>,
  key: string,
  label: string,
): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }
  return value;
}

function parsePrinciple(value: unknown, index: number): CvProfilePrinciple {
  const label = `cv.profile.principles[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);

  const idValue = requireNonEmptyString(value, "id", label);
  if (!principleIds.has(idValue)) {
    throw new Error(`unexpected CV principle id: ${idValue}`);
  }
  const id = CV_PRINCIPLE_IDS.find((candidate) => candidate === idValue);
  if (!id) throw new Error(`unexpected CV principle id: ${idValue}`);

  return {
    id,
    title: requireNonEmptyString(value, "title", label),
    text: requireNonEmptyString(value, "text", label),
  };
}

function parsePrinciples(value: unknown): readonly CvProfilePrinciple[] {
  if (!Array.isArray(value)) {
    throw new Error("cv.profile.principles must be an array");
  }

  const parsed = value.map(parsePrinciple);
  const byId = new Map<CvPrincipleId, CvProfilePrinciple>();

  for (const principle of parsed) {
    if (byId.has(principle.id)) {
      throw new Error(`duplicate CV principle id: ${principle.id}`);
    }
    byId.set(principle.id, principle);
  }

  for (const expectedId of CV_PRINCIPLE_IDS) {
    if (!byId.has(expectedId)) {
      throw new Error(`missing required CV principle id: ${expectedId}`);
    }
  }

  if (parsed.length !== CV_PRINCIPLE_IDS.length) {
    throw new Error(
      `CV principle count must remain ${CV_PRINCIPLE_IDS.length}; got ${parsed.length}`,
    );
  }

  return Object.freeze(CV_PRINCIPLE_IDS.map((id) => {
    const principle = byId.get(id);
    if (!principle) throw new Error(`missing required CV principle id: ${id}`);
    return Object.freeze({ ...principle });
  }));
}

function parseLanguage(value: unknown, index: number): CvLanguage {
  const label = `cv.profile.languages[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);

  const idValue = requireNonEmptyString(value, "id", label);
  if (!languageIds.has(idValue)) {
    throw new Error(`unexpected CV language id: ${idValue}`);
  }
  const id = CV_LANGUAGE_IDS.find((candidate) => candidate === idValue);
  if (!id) throw new Error(`unexpected CV language id: ${idValue}`);

  return {
    id,
    name: requireNonEmptyString(value, "name", label),
    level: requireNonEmptyString(value, "level", label),
  };
}

function parseLanguages(value: unknown): readonly CvLanguage[] {
  if (!Array.isArray(value)) {
    throw new Error("cv.profile.languages must be an array");
  }

  const parsed = value.map(parseLanguage);
  const byId = new Map<CvLanguageId, CvLanguage>();

  for (const language of parsed) {
    if (byId.has(language.id)) {
      throw new Error(`duplicate CV language id: ${language.id}`);
    }
    byId.set(language.id, language);
  }

  for (const expectedId of CV_LANGUAGE_IDS) {
    if (!byId.has(expectedId)) {
      throw new Error(`missing required CV language id: ${expectedId}`);
    }
  }

  if (parsed.length !== CV_LANGUAGE_IDS.length) {
    throw new Error(
      `CV language count must remain ${CV_LANGUAGE_IDS.length}; got ${parsed.length}`,
    );
  }

  return Object.freeze(CV_LANGUAGE_IDS.map((id) => {
    const language = byId.get(id);
    if (!language) throw new Error(`missing required CV language id: ${id}`);
    return Object.freeze({ ...language });
  }));
}

function parseProfile(value: unknown): CvProfileData {
  if (!isRecord(value)) throw new Error("cv.profile must be an object");

  return Object.freeze({
    name: requireNonEmptyString(value, "name", "cv.profile"),
    role: requireNonEmptyString(value, "role", "cv.profile"),
    aboutPrimary: requireNonEmptyString(value, "aboutPrimary", "cv.profile"),
    aboutSecondary: requireNonEmptyString(value, "aboutSecondary", "cv.profile"),
    principles: parsePrinciples(value.principles),
    languages: parseLanguages(value.languages),
  });
}

function parseSkillRow(
  value: unknown,
  index: number,
  sectionId: CvSkillSectionId,
): CvSkillRowData {
  const label = `cv.skills.${sectionId}.rows[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);

  const idValue = requireNonEmptyString(value, "id", label);
  const expectedIds: readonly string[] = CV_SKILL_ROW_IDS[sectionId];
  if (!expectedIds.includes(idValue)) {
    throw new Error(`unexpected CV ${sectionId} row id: ${idValue}`);
  }
  const id = expectedIds.find((candidate) => candidate === idValue) as CvSkillRowId | undefined;
  if (!id) throw new Error(`unexpected CV ${sectionId} row id: ${idValue}`);

  return {
    id,
    label: requireNonEmptyString(value, "label", label),
    text: requireNonEmptyString(value, "text", label),
  };
}

function parseSkillSection(
  value: unknown,
  sectionId: CvSkillSectionId,
): CvSkillSectionData {
  const label = `cv.skills.${sectionId}`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  if (!Array.isArray(value.rows)) throw new Error(`${label}.rows must be an array`);

  const expectedIds: readonly string[] = CV_SKILL_ROW_IDS[sectionId];
  const parsed = value.rows.map((row, index) => parseSkillRow(row, index, sectionId));
  const byId = new Map<string, CvSkillRowData>();

  for (const row of parsed) {
    if (byId.has(row.id)) {
      throw new Error(`duplicate CV ${sectionId} row id: ${row.id}`);
    }
    byId.set(row.id, row);
  }

  for (const expectedId of expectedIds) {
    if (!byId.has(expectedId)) {
      throw new Error(`missing required CV ${sectionId} row id: ${expectedId}`);
    }
  }

  if (parsed.length !== expectedIds.length) {
    throw new Error(
      `CV ${sectionId} row count must remain ${expectedIds.length}; got ${parsed.length}`,
    );
  }

  return Object.freeze({
    title: requireNonEmptyString(value, "title", label),
    rows: Object.freeze(expectedIds.map((id) => {
      const row = byId.get(id);
      if (!row) throw new Error(`missing required CV ${sectionId} row id: ${id}`);
      return Object.freeze({ ...row });
    })),
  });
}

function parseSkills(value: unknown): CvSkillsData {
  if (!isRecord(value)) throw new Error("cv.skills must be an object");

  return Object.freeze({
    hard: parseSkillSection(value.hard, "hard"),
    tech: parseSkillSection(value.tech, "tech"),
    soft: parseSkillSection(value.soft, "soft"),
    tools: parseSkillSection(value.tools, "tools"),
  });
}

function parseExperience(value: unknown, index: number): CvExperienceVisibility {
  const label = `cv.experience[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);

  const idValue = requireNonEmptyString(value, "id", label);
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

function parseExperienceList(value: unknown): readonly CvExperienceVisibility[] {
  if (!Array.isArray(value)) {
    throw new Error("CV content.experience must be an array");
  }

  const parsed = value.map(parseExperience);
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

  return Object.freeze(CV_EXPERIENCE_IDS.map((id) => {
    const item = byId.get(id);
    if (!item) throw new Error(`missing required CV experience id: ${id}`);
    return Object.freeze({ ...item });
  }));
}

export function parseCvContent(value: unknown): CvContentData {
  if (!isRecord(value)) throw new Error("CV content must be an object");

  return Object.freeze({
    profile: parseProfile(value.profile),
    skills: parseSkills(value.skills),
    experience: parseExperienceList(value.experience),
  });
}

const rawCvContent: unknown = cvJson;

export const cvContent = parseCvContent(rawCvContent);
