import { fileURLToPath } from "node:url";

const storybookViteConfig = fileURLToPath(
  new URL("./vite.config.mjs", import.meta.url),
);

const publicOnly = process.env.PUBLIC_STORYBOOK === "1";


const config = {
  stories: ["../../../src/lab/stories/**/*.stories.@(js|mjs)"],
  staticDirs: publicOnly ? [] : [{ from: fileURLToPath(new URL("../../../public/", import.meta.url)), to: "/" }],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
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
