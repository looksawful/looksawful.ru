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
  hard: ["identity", "direction", "product", "communications", "motion", "graphic", "generative", "production"],
  tech: ["design", "development", "graphics-3d", "images", "ai", "motion"],
  soft: ["leader", "researcher", "teacher", "negotiator", "multitasking", "responsible"],
  tools: ["design", "code", "tests", "audio", "color", "shootings", "editing", "ai", "utilities"],
} as const;

export const CV_EDUCATION_COURSE_IDS = [
  "hexlet",
  "stepik",
  "kevin-powell",
  "book-of-shaders",
  "lewy-blue",
  "threejs",
  "figma",
  "ridd",
  "mizko",
  "alexey-bychkov",
  "blender-studio",
  "gamedev-tv",
  "andrey-sokolov",
  "blender-bros",
  "covingsworth",
  "creative-shrimp-hard-surface",
  "creative-shrimp-lighting",
  "phlearn",
  "photoplay-producer",
  "photoplay-model",
] as const;

export const CV_EDUCATION_LINKS = {
  mpgu: "https://mpgu.su/",
  hexlet: "https://ru.hexlet.io/",
  stepik: "https://stepik.org/",
  "kevin-powell": "https://www.kevinpowell.co/",
  "book-of-shaders": "https://thebookofshaders.com/",
  "lewy-blue": "https://discoverthreejs.com/",
  threejs: "https://threejs.org/manual/",
  figma: "https://www.figma.com/resource-library/design-basics/",
  ridd: "https://ridd.substack.com/",
  mizko: "https://www.mizko.net/",
  "alexey-bychkov": "https://www.youtube.com/channel/UCClA4EqjQMGyYR2-TIuHwQw",
  "blender-studio": "https://studio.blender.org/",
  "gamedev-tv": "https://gamedev.tv/courses/blender-environment-artist",
  "andrey-sokolov": "https://www.youtube.com/c/AndreySokolovRu",
  "blender-bros": "https://www.blenderbros.com/",
  covingsworth: "https://www.artstation.com/marketplace/p/PmwnV/ultimate-photorealistic-3d-environment-animation-course-blender-substance-painter-speedtree-davinci-resolve",
  "creative-shrimp-hard-surface": "https://www.creativeshrimp.com/",
  "creative-shrimp-lighting": "https://www.creativeshrimp.com/",
  phlearn: "https://phlearn.com/",
  "photoplay-producer": "https://photoplay.ru/",
  "photoplay-model": "https://photoplay.ru/",
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

export const CV_EXPERIENCE_SHAPES = {
  jestei: { cases: 18, facts: 0, links: 2, description: true },
  styx: { cases: 8, facts: 1, links: 2, description: false },
  illumihand: { cases: 3, facts: 2, links: 0, description: false },
  madcow: { cases: 2, facts: 0, links: 2, description: true },
  sensetique: { cases: 0, facts: 0, links: 1, description: true },
  line: { cases: 3, facts: 0, links: 1, description: true },
  berry: { cases: 3, facts: 2, links: 0, description: false },
  ss: { cases: 5, facts: 1, links: 1, description: true },
  olovo: { cases: 6, facts: 2, links: 2, description: false },
  theatre: { cases: 3, facts: 2, links: 1, description: false },
  soroka: { cases: 3, facts: 2, links: 0, description: false },
  kursovoy: { cases: 0, facts: 2, links: 0, description: false },
  ran: { cases: 4, facts: 2, links: 0, description: false },
  progress: { cases: 2, facts: 0, links: 1, description: true },
  ria: { cases: 0, facts: 0, links: 0, description: true },
} as const;

export type CvPrincipleId = (typeof CV_PRINCIPLE_IDS)[number];
export type CvLanguageId = (typeof CV_LANGUAGE_IDS)[number];
export type CvSkillSectionId = (typeof CV_SKILL_SECTION_IDS)[number];
export type CvSkillRowId = (typeof CV_SKILL_ROW_IDS)[CvSkillSectionId][number];
export type CvEducationCourseId = (typeof CV_EDUCATION_COURSE_IDS)[number];
export type CvEducationEntryId = "mpgu" | CvEducationCourseId;
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

export interface CvContactData {
  location: string;
  phone: string;
  telegram: string;
  instagram: string;
  email: string;
  website: string;
}

export interface CvProfileData {
  name: string;
  role: string;
  aboutPrimary: string;
  aboutSecondary: string;
  contacts: CvContactData;
  principles: readonly CvProfilePrinciple[];
  languages: readonly CvLanguage[];
}

export interface CvSkillRowData {
  id: CvSkillRowId;
  label: string;
  text: string;
}

export interface CvSkillSectionData {
  visible: boolean;
  titleVisible: boolean;
  title: string;
  rows: readonly CvSkillRowData[];
}

export interface CvSkillsData {
  hard: CvSkillSectionData;
  tech: CvSkillSectionData;
  soft: CvSkillSectionData;
  tools: CvSkillSectionData;
}

export interface CvEducationEntryData {
  id: CvEducationEntryId;
  name: string;
  lines: readonly string[];
}

export interface CvEducationData {
  higherTitle: string;
  higher: CvEducationEntryData;
  additionalTitle: string;
  additional: readonly CvEducationEntryData[];
}

export interface CvExperienceFactData {
  label: string;
  text: string;
}

export interface CvExperienceData {
  id: CvExperienceId;
  visible: boolean;
  company: string;
  context: string;
  period: string;
  role: string;
  description: string;
  cases: readonly string[];
  facts: readonly CvExperienceFactData[];
  links: readonly string[];
}

export type CvExperienceVisibility = Pick<CvExperienceData, "id" | "visible">;

export interface CvContentData {
  profile: CvProfileData;
  skills: CvSkillsData;
  education: CvEducationData;
  experience: readonly CvExperienceData[];
}

const principleIds = new Set<string>(CV_PRINCIPLE_IDS);
const languageIds = new Set<string>(CV_LANGUAGE_IDS);
const educationCourseIds = new Set<string>(CV_EDUCATION_COURSE_IDS);
const experienceIds = new Set<string>(CV_EXPERIENCE_IDS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectAllowedKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  requiredKeys: readonly string[],
  label: string,
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) throw new Error(`${label} has unexpected field "${key}"`);
  }
  for (const key of requiredKeys) {
    if (!(key in record)) throw new Error(`${label} is missing field "${key}"`);
  }
}

function requireNonEmptyString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label}.${key} must be a non-empty string`);
  }
  return value;
}

function readEditorialText(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key];
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new Error(`${label}.${key} must be a string when present`);
  return value.trim().length === 0 ? "" : value;
}

function parseStringList(value: unknown, label: string): readonly string[] {
  if (value === undefined || value === null) return Object.freeze([]);
  if (!Array.isArray(value)) throw new Error(`${label} must be an array when present`);
  const parsed = value
    .map((item, index) => {
      if (typeof item !== "string") throw new Error(`${label}[${index}] must be a string`);
      return item.trim().length === 0 ? "" : item;
    })
    .filter((item) => item.length > 0);
  return Object.freeze(parsed);
}

function parseFixedStringList(value: unknown, label: string, expectedCount: number): readonly string[] {
  if (value === undefined || value === null) {
    return Object.freeze(Array.from({ length: expectedCount }, () => ""));
  }
  if (!Array.isArray(value)) throw new Error(`${label} must be an array when present`);
  if (value.length === 0) {
    return Object.freeze(Array.from({ length: expectedCount }, () => ""));
  }
  if (value.length !== expectedCount) {
    throw new Error(`${label} count must remain ${expectedCount}; got ${value.length}`);
  }
  return Object.freeze(value.map((item, index) => {
    if (typeof item !== "string") throw new Error(`${label}[${index}] must be a string`);
    return item.trim().length === 0 ? "" : item;
  }));
}

function parsePrinciple(value: unknown, index: number): CvProfilePrinciple {
  const label = `cv.profile.principles[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(value, ["id", "title", "text"], ["id"], label);
  const idValue = requireNonEmptyString(value, "id", label);
  if (!principleIds.has(idValue)) throw new Error(`unexpected CV principle id: ${idValue}`);
  const id = CV_PRINCIPLE_IDS.find((candidate) => candidate === idValue);
  if (!id) throw new Error(`unexpected CV principle id: ${idValue}`);
  return {
    id,
    title: readEditorialText(value, "title", label),
    text: readEditorialText(value, "text", label),
  };
}

function parsePrinciples(value: unknown): readonly CvProfilePrinciple[] {
  if (!Array.isArray(value)) throw new Error("cv.profile.principles must be an array");
  const parsed = value.map(parsePrinciple);
  const byId = new Map<CvPrincipleId, CvProfilePrinciple>();
  for (const principle of parsed) {
    if (byId.has(principle.id)) throw new Error(`duplicate CV principle id: ${principle.id}`);
    byId.set(principle.id, principle);
  }
  for (const expectedId of CV_PRINCIPLE_IDS) {
    if (!byId.has(expectedId)) throw new Error(`missing required CV principle id: ${expectedId}`);
  }
  if (parsed.length !== CV_PRINCIPLE_IDS.length) {
    throw new Error(`CV principle count must remain ${CV_PRINCIPLE_IDS.length}; got ${parsed.length}`);
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
  expectAllowedKeys(value, ["id", "name", "level"], ["id"], label);
  const idValue = requireNonEmptyString(value, "id", label);
  if (!languageIds.has(idValue)) throw new Error(`unexpected CV language id: ${idValue}`);
  const id = CV_LANGUAGE_IDS.find((candidate) => candidate === idValue);
  if (!id) throw new Error(`unexpected CV language id: ${idValue}`);
  return {
    id,
    name: readEditorialText(value, "name", label),
    level: readEditorialText(value, "level", label),
  };
}

function parseLanguages(value: unknown): readonly CvLanguage[] {
  if (!Array.isArray(value)) throw new Error("cv.profile.languages must be an array");
  const parsed = value.map(parseLanguage);
  const byId = new Map<CvLanguageId, CvLanguage>();
  for (const language of parsed) {
    if (byId.has(language.id)) throw new Error(`duplicate CV language id: ${language.id}`);
    byId.set(language.id, language);
  }
  for (const expectedId of CV_LANGUAGE_IDS) {
    if (!byId.has(expectedId)) throw new Error(`missing required CV language id: ${expectedId}`);
  }
  if (parsed.length !== CV_LANGUAGE_IDS.length) {
    throw new Error(`CV language count must remain ${CV_LANGUAGE_IDS.length}; got ${parsed.length}`);
  }
  return Object.freeze(CV_LANGUAGE_IDS.map((id) => {
    const language = byId.get(id);
    if (!language) throw new Error(`missing required CV language id: ${id}`);
    return Object.freeze({ ...language });
  }));
}

function parseContacts(value: unknown): CvContactData {
  const label = "cv.profile.contacts";
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(
    value,
    ["location", "phone", "telegram", "instagram", "email", "website"],
    [],
    label,
  );

  const location = readEditorialText(value, "location", label);
  const phone = readEditorialText(value, "phone", label);
  const telegram = readEditorialText(value, "telegram", label);
  const instagram = readEditorialText(value, "instagram", label);
  const email = readEditorialText(value, "email", label);
  const website = readEditorialText(value, "website", label);

  const telHref = phone.replace(/[ ()-]/g, "");
  if (phone && !/^\+\d{7,15}$/.test(telHref)) {
    throw new Error(`${label}.phone must be an international phone number beginning with +`);
  }
  if (telegram && !/^@[A-Za-z0-9_]{5,32}$/.test(telegram)) {
    throw new Error(`${label}.telegram must be an @username handle`);
  }
  const instagramUsername = instagram.slice(1);
  if (
    instagram
    && (
      !/^@[A-Za-z0-9._]{1,30}$/.test(instagram)
      || instagramUsername.startsWith(".")
      || instagramUsername.endsWith(".")
      || instagramUsername.includes("..")
    )
  ) {
    throw new Error(`${label}.instagram must be an @username handle`);
  }
  const [emailLocal, emailDomain] = email.split("@");
  if (
    email
    && (
      !/^[^\s@<>:]+@[^\s@<>:]+\.[^\s@<>:]+$/.test(email)
      || emailLocal.startsWith(".")
      || emailLocal.endsWith(".")
      || emailLocal.includes("..")
      || emailDomain.startsWith(".")
      || emailDomain.endsWith(".")
      || emailDomain.includes("..")
    )
  ) {
    throw new Error(`${label}.email must be a valid email address`);
  }

  if (website) {
    let parsedWebsite: URL;
    try {
      parsedWebsite = new URL(website);
    } catch {
      throw new Error(`${label}.website must be an absolute HTTP(S) URL`);
    }
    if (!(["http:", "https:"] as const).includes(parsedWebsite.protocol as "http:" | "https:")) {
      throw new Error(`${label}.website must use http or https`);
    }
    if (parsedWebsite.username || parsedWebsite.password) {
      throw new Error(`${label}.website must not include credentials`);
    }
  }

  return Object.freeze({ location, phone, telegram, instagram, email, website });
}

function parseProfile(value: unknown): CvProfileData {
  if (!isRecord(value)) throw new Error("cv.profile must be an object");
  expectAllowedKeys(
    value,
    ["name", "role", "aboutPrimary", "aboutSecondary", "contacts", "principles", "languages"],
    ["contacts", "principles", "languages"],
    "cv.profile",
  );
  return Object.freeze({
    name: readEditorialText(value, "name", "cv.profile"),
    role: readEditorialText(value, "role", "cv.profile"),
    aboutPrimary: readEditorialText(value, "aboutPrimary", "cv.profile"),
    aboutSecondary: readEditorialText(value, "aboutSecondary", "cv.profile"),
    contacts: parseContacts(value.contacts),
    principles: parsePrinciples(value.principles),
    languages: parseLanguages(value.languages),
  });
}

function parseSkillRow(value: unknown, index: number, sectionId: CvSkillSectionId): CvSkillRowData {
  const label = `cv.skills.${sectionId}.rows[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(value, ["id", "label", "text"], ["id"], label);
  const idValue = requireNonEmptyString(value, "id", label);
  const expectedIds: readonly string[] = CV_SKILL_ROW_IDS[sectionId];
  if (!expectedIds.includes(idValue)) throw new Error(`unexpected CV ${sectionId} row id: ${idValue}`);
  const id = expectedIds.find((candidate) => candidate === idValue) as CvSkillRowId | undefined;
  if (!id) throw new Error(`unexpected CV ${sectionId} row id: ${idValue}`);
  return {
    id,
    label: readEditorialText(value, "label", label),
    text: readEditorialText(value, "text", label),
  };
}

function parseSkillSection(value: unknown, sectionId: CvSkillSectionId): CvSkillSectionData {
  const label = `cv.skills.${sectionId}`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(value, ["visible", "titleVisible", "title", "rows"], ["visible", "titleVisible", "rows"], label);
  if (typeof value.visible !== "boolean") throw new Error(`${label}.visible must be a boolean`);
  if (typeof value.titleVisible !== "boolean") throw new Error(`${label}.titleVisible must be a boolean`);
  if (!Array.isArray(value.rows)) throw new Error(`${label}.rows must be an array`);
  const expectedIds: readonly string[] = CV_SKILL_ROW_IDS[sectionId];
  const parsed = value.rows.map((row, index) => parseSkillRow(row, index, sectionId));
  const byId = new Map<string, CvSkillRowData>();
  for (const row of parsed) {
    if (byId.has(row.id)) throw new Error(`duplicate CV ${sectionId} row id: ${row.id}`);
    byId.set(row.id, row);
  }
  for (const expectedId of expectedIds) {
    if (!byId.has(expectedId)) throw new Error(`missing required CV ${sectionId} row id: ${expectedId}`);
  }
  if (parsed.length !== expectedIds.length) {
    throw new Error(`CV ${sectionId} row count must remain ${expectedIds.length}; got ${parsed.length}`);
  }
  return Object.freeze({
    visible: value.visible,
    titleVisible: value.titleVisible,
    title: readEditorialText(value, "title", label),
    rows: Object.freeze(expectedIds.map((id) => {
      const row = byId.get(id);
      if (!row) throw new Error(`missing required CV ${sectionId} row id: ${id}`);
      return Object.freeze({ ...row });
    })),
  });
}

function parseSkills(value: unknown): CvSkillsData {
  if (!isRecord(value)) throw new Error("cv.skills must be an object");
  expectAllowedKeys(value, CV_SKILL_SECTION_IDS, CV_SKILL_SECTION_IDS, "cv.skills");
  return Object.freeze({
    hard: parseSkillSection(value.hard, "hard"),
    tech: parseSkillSection(value.tech, "tech"),
    soft: parseSkillSection(value.soft, "soft"),
    tools: parseSkillSection(value.tools, "tools"),
  });
}

function parseEducationEntry(value: unknown, label: string, expectedId?: CvEducationEntryId): CvEducationEntryData {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(value, ["id", "name", "lines"], ["id"], label);
  const idValue = requireNonEmptyString(value, "id", label);
  if (expectedId && idValue !== expectedId) {
    throw new Error(`unexpected CV education id: ${idValue}; expected ${expectedId}`);
  }
  if (!expectedId && !educationCourseIds.has(idValue)) {
    throw new Error(`unexpected CV education course id: ${idValue}`);
  }
  const id = idValue as CvEducationEntryId;
  return Object.freeze({
    id,
    name: readEditorialText(value, "name", label),
    lines: parseStringList(value.lines, `${label}.lines`),
  });
}

function parseEducation(value: unknown): CvEducationData {
  if (!isRecord(value)) throw new Error("cv.education must be an object");
  expectAllowedKeys(
    value,
    ["higherTitle", "higher", "additionalTitle", "additional"],
    ["higher", "additional"],
    "cv.education",
  );
  if (!Array.isArray(value.additional)) throw new Error("cv.education.additional must be an array");

  const parsedAdditional = value.additional.map((entry, index) =>
    parseEducationEntry(entry, `cv.education.additional[${index}]`),
  );
  const byId = new Map<string, CvEducationEntryData>();
  for (const entry of parsedAdditional) {
    if (byId.has(entry.id)) throw new Error(`duplicate CV education course id: ${entry.id}`);
    byId.set(entry.id, entry);
  }
  for (const expectedId of CV_EDUCATION_COURSE_IDS) {
    if (!byId.has(expectedId)) throw new Error(`missing required CV education course id: ${expectedId}`);
  }
  if (parsedAdditional.length !== CV_EDUCATION_COURSE_IDS.length) {
    throw new Error(`CV education course count must remain ${CV_EDUCATION_COURSE_IDS.length}; got ${parsedAdditional.length}`);
  }

  return Object.freeze({
    higherTitle: readEditorialText(value, "higherTitle", "cv.education"),
    higher: parseEducationEntry(value.higher, "cv.education.higher", "mpgu"),
    additionalTitle: readEditorialText(value, "additionalTitle", "cv.education"),
    additional: Object.freeze(CV_EDUCATION_COURSE_IDS.map((id) => {
      const entry = byId.get(id);
      if (!entry) throw new Error(`missing required CV education course id: ${id}`);
      return entry;
    })),
  });
}

function parseExperienceFact(value: unknown, label: string): CvExperienceFactData {
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(value, ["label", "text"], [], label);
  return Object.freeze({
    label: readEditorialText(value, "label", label),
    text: readEditorialText(value, "text", label),
  });
}

function parseExperience(value: unknown, index: number): CvExperienceData {
  const label = `cv.experience[${index}]`;
  if (!isRecord(value)) throw new Error(`${label} must be an object`);
  expectAllowedKeys(
    value,
    ["id", "visible", "company", "context", "period", "role", "description", "cases", "facts", "links"],
    ["id", "visible"],
    label,
  );

  const idValue = requireNonEmptyString(value, "id", label);
  if (!experienceIds.has(idValue)) throw new Error(`unexpected CV experience id: ${idValue}`);
  const id = CV_EXPERIENCE_IDS.find((candidate) => candidate === idValue);
  if (!id) throw new Error(`unexpected CV experience id: ${idValue}`);
  if (typeof value.visible !== "boolean") throw new Error(`${label}.visible must be a boolean`);

  const shape = CV_EXPERIENCE_SHAPES[id];
  const description = readEditorialText(value, "description", label);
  if (!shape.description && description.length !== 0) {
    throw new Error(`${label}.description must stay empty because this card has no description slot`);
  }

  if (value.facts !== undefined && value.facts !== null && !Array.isArray(value.facts)) {
    throw new Error(`${label}.facts must be an array when present`);
  }
  const providedFacts = Array.isArray(value.facts) ? value.facts : [];
  const facts = providedFacts.length === 0 && shape.facts > 0
    ? Array.from({ length: shape.facts }, () => ({}))
    : providedFacts;
  if (facts.length !== shape.facts) {
    throw new Error(`${label}.facts count must remain ${shape.facts}; got ${facts.length}`);
  }

  return Object.freeze({
    id,
    visible: value.visible,
    company: readEditorialText(value, "company", label),
    context: readEditorialText(value, "context", label),
    period: readEditorialText(value, "period", label),
    role: readEditorialText(value, "role", label),
    description,
    cases: parseFixedStringList(value.cases, `${label}.cases`, shape.cases),
    facts: Object.freeze(facts.map((fact, factIndex) =>
      parseExperienceFact(fact, `${label}.facts[${factIndex}]`),
    )),
    links: parseFixedStringList(value.links, `${label}.links`, shape.links),
  });
}

function parseExperienceList(value: unknown): readonly CvExperienceData[] {
  if (!Array.isArray(value)) throw new Error("CV content.experience must be an array");
  const parsed = value.map(parseExperience);
  const byId = new Map<CvExperienceId, CvExperienceData>();
  for (const item of parsed) {
    if (byId.has(item.id)) throw new Error(`duplicate CV experience id: ${item.id}`);
    byId.set(item.id, item);
  }
  for (const expectedId of CV_EXPERIENCE_IDS) {
    if (!byId.has(expectedId)) throw new Error(`missing required CV experience id: ${expectedId}`);
  }
  if (parsed.length !== CV_EXPERIENCE_IDS.length) {
    throw new Error(`CV experience count must remain ${CV_EXPERIENCE_IDS.length}; got ${parsed.length}`);
  }
  return Object.freeze(CV_EXPERIENCE_IDS.map((id) => {
    const item = byId.get(id);
    if (!item) throw new Error(`missing required CV experience id: ${id}`);
    return item;
  }));
}

export function parseCvContent(value: unknown): CvContentData {
  if (!isRecord(value)) throw new Error("CV content must be an object");
  expectAllowedKeys(value, ["profile", "skills", "education", "experience"], ["profile", "skills", "education", "experience"], "CV content");
  return Object.freeze({
    profile: parseProfile(value.profile),
    skills: parseSkills(value.skills),
    education: parseEducation(value.education),
    experience: parseExperienceList(value.experience),
  });
}

const rawCvContent: unknown = cvJson;
export const cvContent = parseCvContent(rawCvContent);
