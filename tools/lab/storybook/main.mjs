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
  staticDirs: [{ from: "../../../public", to: "/" }],
  docs: {
    autodocs: "tag",
  },
};

export default config;
