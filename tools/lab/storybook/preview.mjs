import "../../../src/styles/index.css";
// Authored selector exists but is not yet imported by the site stylesheet.
import "../../../src/styles/subproject-cards.css";

const reviewViewports = {
  desktop: {
    name: "Desktop 1440×1000",
    styles: { width: "1440px", height: "1000px" },
    type: "desktop",
  },
  tablet: {
    name: "Tablet 834×1112",
    styles: { width: "834px", height: "1112px" },
    type: "tablet",
  },
  mobile: {
    name: "Mobile 390×844",
    styles: { width: "390px", height: "844px" },
    type: "mobile",
  },
};

export default {
  parameters: {
    layout: "fullscreen",
    viewport: { options: reviewViewports },
    options: { storySort: { order: ["00 Foundations", "01 Atoms"] } },
  },
};
