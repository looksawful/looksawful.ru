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
  render: () => `<main class="wrapper stack" style="--wrapper-max-width:42rem;--stack-space:var(--size-400);padding-block:var(--size-500)">
    <h1 style="font-size:var(--fs-700)">Divider</h1>
    <p>Separates two sections. The line below uses the site's existing <code>.divider</code> style.</p>
    <p>Previous section</p>
    <div class="divider" aria-hidden="true"></div>
    <p>Next section</p>
  </main>`,
  parameters: {
    docs: { description: { story: "Existing .divider from src/styles/components.css and the entity-section renderer, no new CSS rules." } },
  },
};
