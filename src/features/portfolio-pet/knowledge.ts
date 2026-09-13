import { cvContent } from "../../data/cv.ts";
import { getVisibleProjectCardPresentations } from "../../data/projects.ts";

export type PortfolioPetKnowledgeApproval = "pending" | "approved";

export interface PortfolioPetKnowledgeCandidate {
  id: string;
  title?: string;
  text: string;
  source: string;
  approval: PortfolioPetKnowledgeApproval;
}

function pendingCandidate(
  candidate: Omit<PortfolioPetKnowledgeCandidate, "approval">,
): PortfolioPetKnowledgeCandidate {
  return Object.freeze({ ...candidate, approval: "pending" });
}

function compact(parts: readonly string[], maxLength = 2_600): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, maxLength)
    .trim();
}

function profileSkillText(): string {
  const sections = [cvContent.skills.hard, cvContent.skills.tech];
  return compact(sections.flatMap((section) =>
    section.visible
      ? section.rows.map((row) => `${row.label} ${row.text}`)
      : [],
  ));
}

function profileExperienceText(): string {
  return compact(cvContent.experience
    .filter((item) => item.visible)
    .map((item) => compact([
      item.company,
      item.role,
      item.period,
      item.description,
      ...item.cases,
      ...item.facts.map((fact) => `${fact.label} ${fact.text}`),
    ], 900)));
}

function profileEducationText(): string {
  return compact([
    `${cvContent.education.higher.name}: ${cvContent.education.higher.lines.join("; ")}`,
    ...cvContent.education.additional.map((item) =>
      `${item.name}: ${item.lines.join("; ")}`,
    ),
  ]);
}

function profileLanguageText(): string {
  return compact(cvContent.profile.languages.map((item) => `${item.name}: ${item.level}`));
}

function profilePrinciplesText(): string {
  return compact(cvContent.profile.principles.map((item) => `${item.title} ${item.text}`));
}

export function buildPortfolioPetKnowledgeCandidates(): readonly PortfolioPetKnowledgeCandidate[] {
  const profileCandidates: PortfolioPetKnowledgeCandidate[] = [
    pendingCandidate({ id: "profile.name", text: cvContent.profile.name, source: "cv.profile.name" }),
    pendingCandidate({ id: "profile.role", text: cvContent.profile.role, source: "cv.profile.role" }),
    pendingCandidate({ id: "profile.about", text: cvContent.profile.aboutPrimary, source: "cv.profile.aboutPrimary" }),
    pendingCandidate({ id: "profile.skills", text: profileSkillText(), source: "cv.skills.hard+tech" }),
    pendingCandidate({ id: "profile.experience", text: profileExperienceText(), source: "cv.experience.visible" }),
    pendingCandidate({ id: "profile.education", text: profileEducationText(), source: "cv.education" }),
    pendingCandidate({ id: "profile.languages", text: profileLanguageText(), source: "cv.profile.languages" }),
    pendingCandidate({ id: "profile.principles", text: profilePrinciplesText(), source: "cv.profile.principles" }),
  ];

  const projectCandidates = getVisibleProjectCardPresentations().map((project) =>
    pendingCandidate({
      id: `project.${project.id}`,
      title: project.title,
      text: compact([project.focus, project.role ?? "", project.period ?? ""], 900),
      source: `project-card.${project.id}`,
    }),
  );

  return Object.freeze([...profileCandidates, ...projectCandidates]);
}

export function selectApprovedKnowledge(
  candidates: readonly PortfolioPetKnowledgeCandidate[],
  approvedIds: readonly string[],
): readonly PortfolioPetKnowledgeCandidate[] {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  return Object.freeze(
    approvedIds.map((id) => {
      const candidate = byId.get(id);
      if (!candidate) throw new Error(`unknown knowledge candidate: ${id}`);
      return Object.freeze({ ...candidate, approval: "approved" as const });
    }),
  );
}
