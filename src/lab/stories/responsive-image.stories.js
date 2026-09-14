import { mediaCatalogItems } from "../../data/media/catalog.ts";
import { mediaEntries } from "../../data/media/entries/index.ts";
import { responsiveVariantsFor } from "../../data/media/responsive.ts";
import { renderMediaElement } from "../../templates/media-figure.ts";
import { renderResponsiveImageAttributes } from "../../templates/responsive-image.ts";

const fixture = mediaEntries
  .map((entry) => ({
    entry,
    item: mediaCatalogItems.find(({ asset }) => asset.id === entry.assetId),
  }))
  .find(({ item }) =>
    item?.asset.type === "image" && responsiveVariantsFor(item.asset).length > 0
  );
if (!fixture || !fixture.item || fixture.item.asset.type !== "image") {
  throw new Error("Responsive Image story requires a media entry with generated variants");
}
const { item, entry } = fixture;

function renderResponsiveImageFixture(loading) {
  const attributes = renderResponsiveImageAttributes(item.asset, loading);
  const html = renderMediaElement(entry.id, { loading });
  if (!attributes || !html.includes(attributes)) {
    throw new Error(`Production media renderer did not apply responsive ${loading} attributes`);
  }
  return html;
}

const meta = {
  title: "01 Atoms/Responsive Image",
  tags: ["autodocs", "stable"],
  render: () => renderResponsiveImageFixture("lazy"),
  parameters: {
    layout: "centered",
    looksawful: {
      sources: ["src/templates/responsive-image.ts"],
      layer: "atom",
      policy: "isolated",
      canonical: true,
      state: "lazy",
      visibility: ["always"],
      data: ["ready"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: {
      description: {
        component: "Exercises the canonical responsive-image attribute owner through the production media renderer and real catalog/entry data; no image markup or srcset is duplicated in the story.",
      },
    },
  },
};

export default meta;

export const Lazy = {};

export const Eager = {
  render: () => renderResponsiveImageFixture("eager"),
  parameters: {
    looksawful: {
      sources: ["src/templates/responsive-image.ts"],
      layer: "atom",
      policy: "isolated",
      canonical: true,
      state: "eager",
      visibility: ["always"],
      data: ["ready"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
  },
};
