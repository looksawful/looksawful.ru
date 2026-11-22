import { createCodeBlock } from "../../components/code-block.ts";
import { renderCodeBlock } from "../../components/content/code-block.ts";

const enhance = ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-code-block]");
  if (root) createCodeBlock(root);
};

const meta = {
  title: "02 Molecules/Code Block",
  tags: ["autodocs"],
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
        component: "Rendered by src/components/content/code-block.ts and enhanced by src/components/code-block.ts. The copy control is a real production interaction, not a Storybook-only mock.",
      },
    },
  },
};

export default meta;

export const Default = { play: enhance };

export const FocusVisible = {
  play: (context) => {
    enhance(context);
    const button = context.canvasElement.querySelector("[data-code-copy-button]");
    if (button instanceof HTMLButtonElement) button.focus();
  },
};

export const Copied = {
  play: async (context) => {
    enhance(context);
    const button = context.canvasElement.querySelector("[data-code-copy-button]");
    if (button instanceof HTMLButtonElement) button.click();
  },
};

export const LongContent = {
  args: {
    title: "Preview command",
    description: "Longer source checks wrapping and overflow behavior.",
    code: "npm run build:site && node tools/preview/prepare-cloudflare-pages.mjs dist",
  },
  play: enhance,
};
