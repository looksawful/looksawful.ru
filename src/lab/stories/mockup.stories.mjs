import { renderMockup } from "../../components/content/mockup.ts";
import { awfulCasesSettingsMockup } from "../../data/content/awful-cases.ts";
import { berryStoryMockups } from "../../data/content/berry.ts";

const meta = {
  title: "02 Molecules/Mockup",
  tags: ["autodocs"],
  render: () => renderMockup(awfulCasesSettingsMockup),
  parameters: {
    layout: "padded",
    docs: { description: { component: "Uses canonical Mockup rendering with production desktop and mobile dark-theme fixtures." } },
  },
};

export default meta;
export const DesktopDark = {};
export const MobileDark = { render: () => renderMockup(berryStoryMockups[0]) };
