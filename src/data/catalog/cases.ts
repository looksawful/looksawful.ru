import type { CaseData } from "../../types/case.ts";

export const cases = [
  {
    id: "jestei-pool",
    name: "Jestei Pool",
    visibility: "public",
    date: "2024–2026",
    clientIds: ["jestei-pool"],
    roleIds: ["art-director"],
    engagementTypeIds: ["in-house", "embedded"],
    industryIds: ["music", "technology"],
  },

  {
    id: "styx",
    name: "Styx Jewel",
    visibility: "public",
    date: "2021–2025",
    clientIds: ["styx-jewel"],
    roleIds: ["designer", "digital-artist"],
    engagementTypeIds: ["freelance", "long-term-client", "brand-side"],
    industryIds: ["jewelry", "fashion", "ecommerce", "photo-production", "arts"],
  },

  {
    id: "sensetique",
    name: "Sensetique",
    visibility: "public",
    date: "2016–2018",
    roleIds: ["founder", "producer"],
    engagementTypeIds: ["owned", "self-initiated"],
    industryIds: ["photo-production", "fashion", "advertising"],
  },
] as const satisfies readonly CaseData[];

export type Case = (typeof cases)[number];
export type CaseId = Case["id"];
