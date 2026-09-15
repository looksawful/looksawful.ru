import { sensetiqueStudioJustifiedGallery } from "../../data/content/sensetique.ts";
import { renderJustifiedGallery } from "../../templates/justified-gallery.ts";

const meta = {
  title: "03 Organisms/Justified Gallery",
  tags: ["autodocs", "stable", "project:sensetique"],
  render: () => renderJustifiedGallery(sensetiqueStudioJustifiedGallery),
  parameters: {
    layout: "fullscreen",
    looksawful: {
      sources: [
        "src/data/content/sensetique.ts",
        "src/templates/justified-gallery.ts",
        "src/types/justified-gallery.ts",
      ],
      layer: "organism",
      policy: "render-fixture",
      canonical: true,
      state: "responsive-layout",
      visibility: ["always"],
      motion: ["reveal-contract"],
      responsive: {
        review: ["desktop", "tablet", "mobile"],
      },
    },
    docs: {
      description: {
        component: "Uses the canonical Sensetique studio gallery data and production Justified Gallery renderer. Row composition, media presentation, reveal ownership and responsive layout remain production-owned.",
      },
    },
  },
};

export default meta;

export const ResponsiveLayout = {};
