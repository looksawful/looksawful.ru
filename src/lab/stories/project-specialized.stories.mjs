import { renderJesteiTrackFilter } from "../../components/specialized/index.ts";
import { entityPageContents } from "../../content/pages/index.ts";
import { renderSection } from "../../site/renderers/entity/section.ts";

function representative(kind) {
  for (const page of entityPageContents) {
    const section = page.sections.find(
      (candidate) => candidate.type === "specialized" && candidate.kind === kind,
    );
    if (section) return section;
  }
  throw new Error(`Storybook parity: no production specialized section for ${kind}`);
}

function renderRepresentative(kind) {
  return renderSection(representative(kind), {
    specialized: { jesteiTrackFilter: renderJesteiTrackFilter },
  });
}

const meta = {
  title: "03 Organisms/Project Specialized/Production Parity",
  tags: ["lab", "production-source"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Specialized production sections rendered from canonical EntityPage data. These stories expose runtime-heavy surfaces that ordinary ContentBlock stories cannot represent.",
      },
    },
    looksawful: {
      layer: "organism",
      policy: "composition",
      canonical: true,
      sources: [
        "src/site/renderers/entity/section.ts",
        "src/components/specialized/index.ts",
        "src/content/pages/index.ts",
      ],

      state: "production-parity",
      visibility: ["always"],
      responsive: { review: ["desktop", "tablet", "mobile"] },    },
  },
};

export default meta;

export const JesteiTrackFilter = { render: () => renderRepresentative("jestei-track-filter") };
export const MovesCanvasDemo = { render: () => renderRepresentative("moves-canvas-demo") };
export const BerserkTimerShowcase = { render: () => renderRepresentative("berserk-timer-showcase") };
