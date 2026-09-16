import { expect, userEvent } from "storybook/test";
import { createMediaDeck } from "../../components/media-deck.ts";
import { jesteiPromoSequence } from "../../data/content/jestei-pool.ts";
import { renderMediaSlider } from "../../templates/media-slider.ts";

const sliderData = { slides: jesteiPromoSequence.items.slice(0, 3).map((item) => ({ entryId: item.entryId, captionView: "summary" })), captionView: "summary", autoplay: "off" };
const evidence = (state, visibility = ["desktop", "tablet", "mobile"]) => ({ looksawful: { sources: ["src/components/media-deck.ts", "src/templates/media-slider.ts"], layer: "organism", policy: "isolated", canonical: true, state, visibility } });
const mount = (root, allowed) => createMediaDeck(root, { motion: { allowsMotion: () => allowed } });
const meta = { title: "03 Organisms/Media Slider", render: () => renderMediaSlider(sliderData), parameters: evidence("slider", ["desktop", "tablet", "mobile", "reduced-motion"]) };
export default meta;

export const Default = { play: async ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-media-deck]");
  expect(root).toBeInTheDocument();
  mount(root, !matchMedia("(prefers-reduced-motion: reduce)").matches);
  expect(root.querySelector('[data-slide][data-active]')).toBeInTheDocument();
} };
export const NextPrevious = { parameters: evidence("next-prev"), play: async ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-media-deck]");
  mount(root, true);
  const slides = [...root.querySelectorAll("[data-slide]")];
  await userEvent.click(root.querySelector("[data-deck-next]"));
  expect(slides[1]).toHaveAttribute("data-active");
  await userEvent.click(root.querySelector("[data-deck-prev]"));
  expect(slides[0]).toHaveAttribute("data-active");
  expect(slides[0]).toHaveAttribute("aria-hidden", "false");
} };
