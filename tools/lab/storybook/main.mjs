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
  docs: {
    autodocs: "tag",
  },
};

export default config;
