import cvStructureJson from "../content/cv.json" with { type: "json" };
import cvEditorialJson from "../content/editorial/cv.json" with { type: "json" };
import {
  CV_EDUCATION_COURSE_IDS,
  CV_EXPERIENCE_IDS,
  CV_LANGUAGE_IDS,
  CV_PRINCIPLE_IDS,
  CV_SKILL_ROW_IDS,
  CV_SKILL_SECTION_IDS,
  type CvEducationCourseId,
  type CvExperienceId,
  type CvLanguageId,
  type CvPrincipleId,
  type CvSkillSectionId,
} from "./cv-contract.ts";

interface StructuralSkillSection {
  visible: boolean;
  titleVisible: boolean;
}

interface StructuralExperience {
  visible: boolean;
  links: readonly string[];
}

interface CvStructureSource {
  profile: {
    contacts: {
      phone: string;
      telegram: string;
      instagram: string;
      email: string;
      website: string;
    };
  };
  skills: Record<CvSkillSectionId, StructuralSkillSection>;
  experience: Record<CvExperienceId, StructuralExperience>;
}

interface EditorialPair {
  title?: string;
  text?: string;
  label?: string;
  name?: string;
  level?: string;
}

interface EditorialEducationEntry {
  name: string;
  lines: readonly string[];
}

interface EditorialExperience {
  company: string;
  context: string;
  period: string;
  role: string;
  description: string;
  cases: readonly string[];
  facts: readonly { label: string; text: string }[];
}

interface CvEditorialSource {
  profile: {
    name: string;
    role: string;
    aboutPrimary: string;
    aboutSecondary: string;
    location: string;
    principles: Record<CvPrincipleId, Required<Pick<EditorialPair, "title" | "text">>>;
    languages: Record<CvLanguageId, Required<Pick<EditorialPair, "name" | "level">>>;
  };
  skills: Record<CvSkillSectionId, {
    title: string;
    rows: Record<string, Required<Pick<EditorialPair, "label" | "text">>>;
  }>;
  education: {
    higherTitle: string;
    higher: EditorialEducationEntry;
    additionalTitle: string;
    additional: Record<CvEducationCourseId, EditorialEducationEntry>;
  };
  experience: Record<CvExperienceId, EditorialExperience>;
}

const structure = cvStructureJson as unknown as CvStructureSource;

export function composeCvSourceJson(
  editorialSource: CvEditorialSource = cvEditorialJson as unknown as CvEditorialSource,
) {
  const editorial = editorialSource;
  return Object.freeze({
  profile: Object.freeze({
    name: editorial.profile.name,
    role: editorial.profile.role,
    aboutPrimary: editorial.profile.aboutPrimary,
    aboutSecondary: editorial.profile.aboutSecondary,
    contacts: Object.freeze({
      location: editorial.profile.location,
      phone: structure.profile.contacts.phone,
      telegram: structure.profile.contacts.telegram,
      instagram: structure.profile.contacts.instagram,
      email: structure.profile.contacts.email,
      website: structure.profile.contacts.website,
    }),
    principles: Object.freeze(CV_PRINCIPLE_IDS.map((id) => Object.freeze({
      id,
      title: editorial.profile.principles[id].title,
      text: editorial.profile.principles[id].text,
    }))),
    languages: Object.freeze(CV_LANGUAGE_IDS.map((id) => Object.freeze({
      id,
      name: editorial.profile.languages[id].name,
      level: editorial.profile.languages[id].level,
    }))),
  }),
  skills: Object.freeze(Object.fromEntries(CV_SKILL_SECTION_IDS.map((sectionId) => {
    const copy = editorial.skills[sectionId];
    const state = structure.skills[sectionId];
    return [sectionId, Object.freeze({
      visible: state.visible,
      titleVisible: state.titleVisible,
      title: copy.title,
      rows: Object.freeze(CV_SKILL_ROW_IDS[sectionId].map((id) => Object.freeze({
        id,
        label: copy.rows[id].label,
        text: copy.rows[id].text,
      }))),
    })];
  }))),
  education: Object.freeze({
    higherTitle: editorial.education.higherTitle,
    higher: Object.freeze({
      id: "mpgu",
      name: editorial.education.higher.name,
      lines: Object.freeze([...editorial.education.higher.lines]),
    }),
    additionalTitle: editorial.education.additionalTitle,
    additional: Object.freeze(CV_EDUCATION_COURSE_IDS.map((id) => Object.freeze({
      id,
      name: editorial.education.additional[id].name,
      lines: Object.freeze([...editorial.education.additional[id].lines]),
    }))),
  }),
  experience: Object.freeze(CV_EXPERIENCE_IDS.map((id) => {
    const copy = editorial.experience[id];
    const state = structure.experience[id];
    return Object.freeze({
      id,
      visible: state.visible,
      company: copy.company,
      context: copy.context,
      period: copy.period,
      role: copy.role,
      description: copy.description,
      cases: Object.freeze([...copy.cases]),
      facts: Object.freeze(copy.facts.map((fact) => Object.freeze({ ...fact }))),
      links: Object.freeze([...state.links]),
    });
  })),
  });
}

export const cvSourceJson = composeCvSourceJson();
