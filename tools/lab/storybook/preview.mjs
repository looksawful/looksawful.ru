import "../../../src/styles/index.css";
import "../../../src/lab/model-viewer-controls-prototype.css";

const labReviewViewports = {
  desktop: {
    name: "Lab desktop 1440×1000",
    styles: { width: "1440px", height: "1000px" },
    type: "desktop",
  },
  tablet: {
    name: "Lab tablet 834×1112",
    styles: { width: "834px", height: "1112px" },
    type: "tablet",
  },
  mobile: {
    name: "Lab mobile 390×844",
    styles: { width: "390px", height: "844px" },
    type: "mobile",
  },
};

const preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: labReviewViewports,
    },
    options: {
      storySort: {
        order: [
          "00 Foundations",
          "01 Atoms",
          "02 Molecules",
          "03 Organisms",
          "04 Templates",
          "05 Pages",
          "06 Motion",
          "90 Experimental",
        ],
      },
    },
    a11y: {
      test: "error",
    },
  },
};

export default preview;
