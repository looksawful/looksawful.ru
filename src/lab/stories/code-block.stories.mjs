import { createCodeBlock } from "../../components/code-block.ts";
import { renderCodeBlock } from "../../components/content/code-block.ts";

const enhance = ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-code-block]");
  if (root) createCodeBlock(root);
};

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
    looksawful: {
      sources: ["src/components/code-block.ts", "src/components/content/code-block.ts"],
      layer: "molecule",
      policy: "behavior-fixture",
      canonical: true,
      state: "copy-ready",
      visibility: ["always"],
      interaction: ["default", "focus-visible", "active-or-pressed"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
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
  parameters: {
    looksawful: {
      state: "focus-visible",
      interaction: ["focus-visible"],
    },
  },
};

export const Copied = {
  play: async (context) => {
    enhance(context);
    const button = context.canvasElement.querySelector("[data-code-copy-button]");
    if (button instanceof HTMLButtonElement) button.click();
  },
  parameters: {
    looksawful: {
      state: "copied-confirmation",
      interaction: ["active-or-pressed"],
    },
  },
};

export const LongContent = {
  args: {
    title: "Preview command",
    description: "Longer source checks wrapping and overflow behavior.",
    code: "npm run build:site && node tools/preview/prepare-cloudflare-pages.mjs dist",
  },
  play: enhance,
  parameters: {
    looksawful: { state: "long-content-responsive" },
  },
};
