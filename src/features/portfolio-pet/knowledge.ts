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

export function buildPortfolioPetKnowledgeCandidates(): readonly PortfolioPetKnowledgeCandidate[] {
  const profileCandidates: PortfolioPetKnowledgeCandidate[] = [
    pendingCandidate({ id: "profile.name", text: cvContent.profile.name, source: "cv.profile.name" }),
    pendingCandidate({ id: "profile.role", text: cvContent.profile.role, source: "cv.profile.role" }),
    pendingCandidate({ id: "profile.about", text: cvContent.profile.aboutPrimary, source: "cv.profile.aboutPrimary" }),
  ];

  const projectCandidates = getVisibleProjectCardPresentations().map((project) =>
    pendingCandidate({
      id: `project.${project.id}`,
      title: project.title,
      text: project.focus,
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
