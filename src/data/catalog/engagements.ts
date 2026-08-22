import type { EngagementData } from "../../types/engagement.ts";

export const engagements = [
  {
    id: "jestei-pool-2024-2026",
    date: "2024–2026",
    clientIds: ["jestei-pool"],
    primaryRoleId: "art-director",
    roleIds: ["art-director"],
    engagementTypeIds: ["in-house", "embedded"],
    industryIds: ["music", "technology"],
  },
  {
    id: "styx-jewel-2021-2025",
    date: "2021–2025",
    clientIds: ["styx-jewel"],
    primaryRoleId: "designer",
    roleIds: ["designer", "digital-artist", "graphic-designer", "producer", "photographer"],
    engagementTypeIds: ["freelance", "long-term-client", "brand-side"],
    industryIds: ["jewelry", "fashion", "ecommerce", "photo-production", "arts"],
  },
  {
    id: "sensetique-2016-2018",
    displayName: "Sensetique",
    date: "2016–2018",
    primaryRoleId: "founder",
    roleIds: ["founder", "producer"],
    engagementTypeIds: ["owned", "self-initiated"],
    industryIds: [
      "photo-production",
      "fashion",
      "advertising",
      "video-production",
      "beauty",
      "ecommerce",
      "creative-production",
    ],
  },
  {
    id: "lyve-moscow-2025",
    date: "2025",
    clientIds: ["lyve-moscow"],
    primaryRoleId: "designer",
    roleIds: ["designer", "illustrator"],
  },
  {
    id: "berry-agency-2020",
    date: "2020",
    clientIds: ["berry-agency"],
    primaryRoleId: "smm-manager",
    primaryRoleLabel: "СММ",
    roleIds: ["smm-manager", "photographer", "graphic-designer"],
    description:
      "Работал фотографом и SMM-специалистом агентства, составлял контент-план, создавал дизайн постов, укомплектовал студию агентства оборудованием, снимал модельные тесты, коммерческие и эдиториал-фотосъёмки.",
  },
  {
    id: "s-and-s-2018-2019",
    date: "2018–2019",
    clientIds: ["s-and-s"],
    primaryRoleId: "smm-manager",
    primaryRoleLabel: "СММ",
    roleIds: ["smm-manager"],
  },
  {
    id: "mad-cow-films-2019",
    date: "2019",
    clientIds: ["mad-cow-films"],
    primaryRoleId: "assistant-producer",
    primaryRoleLabel: "ассистент продюсера",
    roleIds: ["assistant-producer"],
  },
  {
    id: "li-ne-agency-2017",
    date: "2017",
    clientIds: ["li-ne-agency"],
    primaryRoleId: "junior-producer",
    primaryRoleLabel: "JR продюсер",
    roleIds: ["junior-producer"],
  },
  {
    id: "progress-tradition-2013-2015",
    date: "2013–2015",
    clientIds: ["progress-tradition"],
    primaryRoleId: "book-designer",
    roleIds: ["book-designer"],
  },
  {
    id: "moskovskie-novosti-2012",
    displayName: "РИА Новости / Московские новости",
    date: "2012",
    clientIds: ["ria-novosti", "moskovskie-novosti"],
    primaryRoleId: "layout-designer",
    roleIds: ["layout-designer"],
  },
] as const satisfies readonly EngagementData[];

export type Engagement = (typeof engagements)[number];
export type EngagementId = Engagement["id"];
