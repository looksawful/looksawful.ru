import { renderMediaFigure } from "../../components/content/media-figure.ts";
import { awfulCasesDemo } from "../../data/content/awful-cases.ts";

const meta = {
  title: "02 Molecules/Media Figure",
  tags: ["autodocs"],
  render: () => renderMediaFigure(awfulCasesDemo, { reveal: false }),
  parameters: {
    layout: "padded",
    docs: { description: { component: "Uses the canonical Media Figure renderer and the real Awful Cases demo video fixture with page reveal orchestration disabled." } },
  },
};

export default meta;

export const VideoBanner = {};
