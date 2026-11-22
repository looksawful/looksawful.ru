import { awfulCasesSettingsMockup } from "../../data/content/awful-cases.ts";
import { renderMediaElement } from "../../templates/media-figure.ts";

// Only genuinely production-owned atoms appear here. Existing Client Logo
// remains in its own canonical story. New control families belong to #1106.
const meta = {
  title: "01 Atoms/Production Primitives",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Read-only production media-element renderer. Divider and Client Logo have independent atom stories. New Button/Badge/Chip/Tooltip contracts are explicitly deferred to issue #1106 rather than invented for Storybook.",
      },
    },
  },
};
export default meta;

export const MediaImage = {
  render: () => '<div class="wrapper" style="--wrapper-max-width:36rem;padding-block:var(--size-300)">' +
    renderMediaElement(awfulCasesSettingsMockup.entryId, { loading: "lazy" }) + '</div>',
  parameters: {
    docs: { description: { story: "Production renderMediaElement with the canonical Awful Cases screenshot entry, not a Storybook-only image fixture." } },
  },
};
