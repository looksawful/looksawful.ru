const meta = {
  title: "01 Atoms/Divider",
  tags: ["autodocs", "stable"],
  parameters: {
    layout: "padded",
    looksawful: {
      sources: ["src/styles/components.css", "src/site/renderers/entity/section.ts"],
      layer: "atom",
      policy: "isolated",
      canonical: true,
      state: "read-only",
    },
  },
};
export default meta;

export const Divider = {
  render: () => '<div class="wrapper" style="--wrapper-max-width:42rem;padding-block:var(--size-400)"><div class="divider" aria-hidden="true"></div></div>',
  parameters: {
    docs: { description: { story: "Existing .divider from src/styles/components.css and the entity-section renderer, no new CSS rules." } },
  },
};
