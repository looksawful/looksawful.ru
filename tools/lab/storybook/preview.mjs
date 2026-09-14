import "../../../src/styles/index.css";
import "../../../src/lab/model-viewer-controls-prototype.css";

const preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
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
      test: "todo",
    },
  },
};

export default preview;
