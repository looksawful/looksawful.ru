import { usePublishedAssetUrls, usePublishedAssetUrlsInNode } from "../../../src/lab/storybook/published-assets.mjs";
import "../../../src/styles/index.css";

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

// The published portfolio owns media. Both Storybook entrypoints render the
// same stories and reference their already-public assets instead of copying 1 GB.
const withPublicPortfolioAssets = (story) => {
  const content = story();
  if (typeof content === "string") return usePublishedAssetUrls(content);
  if (content instanceof Element) return usePublishedAssetUrlsInNode(content);
  return content;
};

const preview = {
  decorators: [withPublicPortfolioAssets],
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: labReviewViewports,
    },
    options: {
      storySort: {
        order: [
          "00 Foundations", "01 Atoms", "02 Molecules", "03 Organisms",
          "04 Layout", "05 Patterns & Templates", "06 Pages",
          "07 Motion", "08 Feedback", "90 Experimental",
        ],
      },
    },
    a11y: {
      test: "error",
    },
  },
};

export default preview;
