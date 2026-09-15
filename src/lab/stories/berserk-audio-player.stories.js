import { createBerserkAudioPlayer } from "../../components/berserk-audio-player.ts";

const renderPlayer = () => `
  <div class="berserk-audio" data-berserk-audio-player="">
    <div class="berserk-audio__head cluster">
      <span>audio settings / player</span>
      <span data-audio-status="">ready</span>
    </div>
    <div aria-hidden="true" class="berserk-audio__wave">▁▂▃▆█▆▃▂▁▂▅▇▅▂▁▃▆█▇▃▂▁</div>
    <div class="berserk-audio__row cluster">
      <button aria-pressed="false" class="berserk-audio__button" data-audio-play="" type="button">play / pause</button>
    </div>
    <div class="berserk-audio__progress" data-audio-progress=""><span data-audio-progress-fill=""></span></div>
    <div class="berserk-audio__meta cluster">
      <span data-audio-current="">00:00</span><span data-audio-duration="">00:00</span>
    </div>
    <div class="berserk-audio__sounds cluster">
      <button aria-pressed="false" class="berserk-audio__button" data-audio-sound="alert1.wav" type="button">alert1</button>
      <button aria-pressed="false" class="berserk-audio__button" data-audio-sound="alert2.wav" type="button">alert2</button>
      <button aria-pressed="false" class="berserk-audio__button" data-audio-sound="alert3.wav" type="button">alert3</button>
      <button aria-pressed="false" class="berserk-audio__button" data-audio-sound="alert4.wav" type="button">alert4</button>
    </div>
    <label class="berserk-audio__volume">volume
      <input data-audio-volume="" max="1" min="0" step="0.1" type="range" value="0.5">
      <span data-audio-volume-text="">5/10</span>
    </label>
    <audio preload="metadata"></audio>
  </div>`;

const mount = (canvasElement) => {
  const root = canvasElement.querySelector("[data-berserk-audio-player]");
  if (root) createBerserkAudioPlayer(root);
};

const meta = {
  title: "03 Organisms/Berserk Audio Player",
  tags: ["autodocs", "stable", "project:berserk-timer"],
  render: renderPlayer,
  parameters: {
    layout: "centered",
    looksawful: {
      sources: ["src/components/berserk-audio-player.ts", "src/styles/components.css"],
      layer: "organism",
      policy: "behavior-fixture",
      canonical: true,
      state: ["ready", "sound-selected", "playing", "blocked"],
      visibility: ["always"],
      responsive: { review: ["desktop", "tablet", "mobile"] },
    },
    docs: {
      description: {
        component: "Uses the production Berserk Audio Player runtime and its production data/ARIA contract. Playback, sound selection, seek, volume, status updates and CDN-to-raw fallback remain production-owned.",
      },
    },
  },
};

export default meta;

export const Ready = {
  play: ({ canvasElement }) => mount(canvasElement),
};

export const SoundSelected = {
  play: ({ canvasElement }) => {
    mount(canvasElement);
    canvasElement.querySelector('[data-audio-sound="alert2.wav"]')?.click();
  },
};
