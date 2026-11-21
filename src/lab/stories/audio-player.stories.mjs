import { createBerserkAudioPlayer } from "../../components/berserk-audio-player.ts";

function playerMarkup() {
  // The production runtime owns player behavior; this is its required host DOM.
  return '<main class="wrapper" style="--wrapper-max-width:40rem;padding-block:var(--size-500)">' +
    '<section class="stack" data-berserk-audio-player style="--stack-space:var(--size-300)">' +
    '<h2>Berserk Timer · audio player</h2>' +
    '<audio preload="none"></audio>' +
    '<div class="cluster" role="group" aria-label="Sounds">' +
    '<button type="button" data-audio-sound="alert1.wav" aria-pressed="false">Alert 1</button>' +
    '<button type="button" data-audio-sound="alert2.wav" aria-pressed="false">Alert 2</button>' +
    '</div>' +
    '<button type="button" data-audio-play aria-pressed="false">Play / pause</button>' +
    '<div data-audio-progress style="block-size:8px;background:var(--clr-border);cursor:pointer">' +
    '<div data-audio-progress-fill style="block-size:100%;inline-size:0;background:var(--clr-accent)"></div></div>' +
    '<div class="cluster"><span data-audio-current>00:00</span><span>/</span><span data-audio-duration>00:00</span></div>' +
    '<label>Volume <input type="range" data-audio-volume min="0" max="1" value="0.5" step="0.1"></label>' +
    '<p>Volume: <output data-audio-volume-text>5/10</output>; status: <output data-audio-status>initializing</output></p>' +
    '</section></main>';
}
const initialize = ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-berserk-audio-player]");
  if (root instanceof HTMLElement) return createBerserkAudioPlayer(root);
  return () => {};
};

const meta = {
  title: "03 Organisms/Audio Player",
  tags: ["autodocs", "stable"],
  render: playerMarkup,
  parameters: {
    layout: "padded",
    looksawful: {
      sources: ["src/components/berserk-audio-player.ts"],
      layer: "organism",
      policy: "runtime-host-fixture",
      canonical: false,
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: { description: { component: "Production Berserk audio controller with its required data-attribute DOM. Audio is loaded from the controller's existing public CDN, never bundled into Storybook." } },
  },
};
export default meta;

export const Ready = { play: initialize };
export const AlternateSound = {
  play: (context) => {
    initialize(context);
    const button = context.canvasElement.querySelector('[data-audio-sound="alert2.wav"]');
    if (button instanceof HTMLButtonElement) button.click();
  },
};
