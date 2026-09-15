export const projectSurfaceStoryCoverage = Object.freeze({
  "code-block": { status: "direct", storyFile: "src/lab/stories/code-block.stories.js" },
  "media-figure": { status: "direct", storyFile: "src/lab/stories/project-content-blocks.stories.mjs" },
  "media-group": { status: "direct", storyFile: "src/lab/stories/project-content-blocks.stories.mjs" },
  "media-slider": { status: "direct", storyFile: "src/lab/stories/project-content-blocks.stories.mjs" },
  mockup: { status: "direct", storyFile: "src/lab/stories/project-content-blocks.stories.mjs" },
  "mockup-deck": { status: "direct", storyFile: "src/lab/stories/project-content-blocks.stories.mjs" },
  "justified-gallery": { status: "direct", storyFile: "src/lab/stories/justified-gallery.stories.js" },
  "before-after": { status: "direct", storyFile: "src/lab/stories/before-after.stories.js" },
  "page-flip": { status: "direct", storyFile: "src/lab/stories/project-content-blocks.stories.mjs" },
  "animated-canvas-gallery": { status: "direct", storyFile: "src/lab/stories/animated-canvas-gallery.stories.js" },
  "jestei-theme": { status: "direct", storyFile: "src/lab/stories/project-content-blocks.stories.mjs" },
  "awful-cases-game": { status: "direct", storyFile: "src/lab/stories/project-content-blocks.stories.mjs" },

  "jestei-track-filter": { status: "direct", storyFile: "src/lab/stories/project-specialized.stories.mjs" },
  "moves-canvas-demo": { status: "direct", storyFile: "src/lab/stories/project-specialized.stories.mjs" },
  "berserk-timer-showcase": { status: "direct", storyFile: "src/lab/stories/project-specialized.stories.mjs" },

  "entity-intro": { status: "direct", storyFile: "src/lab/stories/project-composition.stories.mjs" },
  "section-intro": { status: "direct", storyFile: "src/lab/stories/project-composition.stories.mjs" },
  "resource-links": { status: "direct", storyFile: "src/lab/stories/project-composition.stories.mjs" },
  "project-teaser": {
    status: "blocked",
    issue: 967,
    reason: "The canonical ProjectTeaser contract has no production renderer yet; a Lab-only renderer would create a second implementation.",
  },
  "portfolio-entity-card": { status: "direct", storyFile: "src/lab/stories/project-composition.stories.mjs" },
  "responsive-image": {
    status: "indirect",
    storyFile: "src/lab/stories/project-composition.stories.mjs",
    reason: "Attribute helper is exercised through the canonical media-figure renderer rather than duplicated as standalone markup.",
  },

  "project-card": { status: "direct", storyFile: "src/lab/stories/project-composition.stories.mjs" },
  "subproject-card": { status: "direct", storyFile: "src/lab/stories/project-composition.stories.mjs" },
  "pet-project-card": { status: "direct", storyFile: "src/lab/stories/pet-projects.stories.js" },
});

export const allowedProjectSurfaceCoverageStatuses = Object.freeze([
  "direct",
  "indirect",
  "blocked",
]);
