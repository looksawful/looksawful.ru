import homeVisibility from "../../content/visibility/home.json" with { type: "json" };
import { parseSectionVisibility } from "../../data/content/section-visibility.ts";

const records = parseSectionVisibility(homeVisibility, ["client-logo-wall"]);
const clientLogoWall = records.find((record) => record.id === "client-logo-wall");

const render = () => `<section data-home-section="client-logo-wall"${clientLogoWall?.visible ? "" : " hidden"}></section>`;

const meta = {
  title: "03 Organisms/Home Section Visibility",
  tags: ["autodocs", "stable"],
  render,
  parameters: {
    layout: "padded",
    looksawful: {
      sources: [
        "src/content/visibility/home.json",
        "src/data/content/section-visibility.ts",
      ],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: "section-hidden",
      visibility: ["conditional", "data"],
      data: ["ready"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
  },
};

export default meta;
export const Hidden = {};
