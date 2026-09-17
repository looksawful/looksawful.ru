import { expect, userEvent } from "storybook/test";
import { renderAwfulCasesGame } from "../../components/specialized/awful-cases-game.ts";
const evidence = (state) => ({ looksawful: { sources: ["src/components/specialized/awful-cases-game.ts", "src/components/awful-cases-game.js"], layer: "organism", policy: "isolated", canonical: true, state, visibility: ["breakpoint"], motion: ["motion-enabled", "reduced-motion"], responsive: { review: ["desktop", "tablet", "mobile"] } } });
const meta = { title: "03 Organisms/Awful Cases Game", render: renderAwfulCasesGame, parameters: evidence("start") };
export default meta;
export const Start = { play: async ({ canvasElement }) => {
  await import("../../components/awful-cases-game.js");
  const start = canvasElement.querySelector("#startPanel");
  expect(start).not.toHaveAttribute("hidden");
  await userEvent.click(canvasElement.querySelector("#startButton"));
  expect(start).toHaveAttribute("hidden");
} };
export const Restart = { parameters: evidence("restart"), play: async ({ canvasElement }) => {
  await import("../../components/awful-cases-game.js");
  const trainer = canvasElement.ownerDocument.defaultView?.awfulCasesCaseTrainer;
  trainer?.reset?.();
  expect(canvasElement.querySelector("#startPanel")).toHaveAttribute("hidden");
  expect(canvasElement.querySelector("#runnerGameShell")).toBeInTheDocument();
} };
