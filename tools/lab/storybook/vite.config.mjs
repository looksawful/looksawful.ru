// Storybook intentionally owns an isolated Vite configuration.
// Site-level multi-page build orchestration and production plugins are not
// part of the design-system viewer.
export default {
  css: {
    lightningcss: {
      drafts: {
        scrollNavigationControls: true,
      },
    },
  },
};
