import { createCodeBlock } from "../../components/code-block.ts";
import { renderCodeBlock } from "../../components/content/code-block.ts";

const meta = {
  title: "02 Molecules/Code Block",
  tags: ["autodocs", "stable", "a11y-reviewed"],
  args: {
    title: "Install",
    description: "Canonical renderer and runtime behavior from src/components.",
    language: "shell",
    code: "npm run lab",
  },
  render: (args) => renderCodeBlock(args),
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Rendered by src/components/content/code-block.ts and enhanced by src/components/code-block.ts. The story does not own a duplicate implementation.",
      },
    },
  },
};

export default meta;

export const Default = {
  play: ({ canvasElement }) => {
    const root = canvasElement.querySelector("[data-code-block]");
    if (root) createCodeBlock(root);
  },
};

export const LongContent = {
  args: {
    title: "Preview command",
    description: "Longer source checks wrapping and overflow behavior.",
    code: "npm run build:site && node tools/preview/prepare-cloudflare-pages.mjs dist",
  },
  play: Default.play,
};
