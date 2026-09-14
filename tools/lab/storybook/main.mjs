import { fileURLToPath } from "node:url";

const storybookViteConfig = fileURLToPath(
  new URL("./vite.config.mjs", import.meta.url),
);

const config = {
  stories: ["../../../src/lab/stories/**/*.stories.@(js|mjs)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "storybook-design-token",
  ],
  framework: {
    name: "@storybook/html-vite",
    options: {},
  },
  core: {
    builder: {
      name: "@storybook/builder-vite",
      options: {
        viteConfigPath: storybookViteConfig,
      },
    },
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
