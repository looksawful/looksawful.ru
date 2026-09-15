import { fileURLToPath } from "node:url";

const storybookViteConfig = fileURLToPath(
  new URL("./vite.config.mjs", import.meta.url),
);

const config = {
  staticDirs: ["../../../public"],
  stories: ["../../../src/lab/stories/**/*.stories.@(js|mjs)"],
  staticDirs: [{ from: fileURLToPath(new URL("../../../public/", import.meta.url)), to: "/" }],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    {
      name: "storybook-design-token",
      options: {
        designTokenGlob: "src/**/*.css",
      },
    },
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
