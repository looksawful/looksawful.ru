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
