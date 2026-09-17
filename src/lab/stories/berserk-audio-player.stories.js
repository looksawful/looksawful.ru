import { expect, fireEvent, userEvent } from "storybook/test";
import { createBerserkAudioPlayer } from "../../components/berserk-audio-player.ts";
const renderPlayer = () => `<section data-berserk-audio-player><audio></audio><button type="button" data-audio-play aria-pressed="false">play</button><div data-audio-progress><i data-audio-progress-fill></i></div><span data-audio-current>00:00</span><span data-audio-duration>00:00</span><input data-audio-volume type="range" min="0" max="1" step="0.1" value="0.5"><span data-audio-volume-text>5/10</span><span data-audio-status>ready</span><button type="button" data-audio-sound="alert1.wav">alert 1</button><button type="button" data-audio-sound="alert2.wav">alert 2</button></section>`;
const evidence = (state) => ({ looksawful: { sources: ["src/components/berserk-audio-player.ts"], layer: "organism", policy: "behavior-fixture", canonical: true, state, visibility: ["breakpoint"], motion: ["motion-enabled", "reduced-motion"], responsive: { review: ["desktop", "tablet", "mobile"] } } });
const meta = { title: "03 Organisms/Berserk Audio Player", render: renderPlayer, parameters: evidence("ready") };
export default meta;
export const Ready = { play: async ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-berserk-audio-player]");
  createBerserkAudioPlayer(root);
  expect(root.querySelector('[data-audio-sound="alert1.wav"]')).toHaveAttribute("aria-pressed", "true");
  await userEvent.tab();
  expect(canvasElement.ownerDocument.activeElement).not.toBe(canvasElement.ownerDocument.body);
} };
export const PlayingPaused = { parameters: evidence("playing-paused"), play: async ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-berserk-audio-player]");
  createBerserkAudioPlayer(root);
  const audio = root.querySelector("audio");
  const play = root.querySelector("[data-audio-play]");
  await fireEvent(audio, new Event("play"));
  expect(play).toHaveAttribute("aria-pressed", "true");
  expect(root.querySelector("[data-audio-status]")).toHaveTextContent("playing");
  await fireEvent(audio, new Event("pause"));
  expect(play).toHaveAttribute("aria-pressed", "false");
} };
export const AlternateSound = { parameters: evidence("selected"), play: async ({ canvasElement }) => {
  const root = canvasElement.querySelector("[data-berserk-audio-player]");
  createBerserkAudioPlayer(root);
  const first = root.querySelector('[data-audio-sound="alert1.wav"]');
  const second = root.querySelector('[data-audio-sound="alert2.wav"]');
  await userEvent.click(second);
  expect(second).toHaveAttribute("aria-pressed", "true");
  expect(first).toHaveAttribute("aria-pressed", "false");
} };
