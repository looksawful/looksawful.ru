import fs from "node:fs/promises";

const GAME_PATH = "public/pets/awful-cases/awful-cases.js";
const MAIN_PATH = "index.html";
const STANDALONE_PATH = "public/pets/awful-cases/index.html";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

let game = await fs.readFile(GAME_PATH, "utf8");
const oldDelta = "const dt = Math.min(.034, (now - game.last) / 1000 || 0);";
const safeDelta = "const dt = Math.max(0, Math.min(.034, (now - game.last) / 1000 || 0));";
if (game.includes(oldDelta)) game = game.replace(oldDelta, safeDelta);
assert(game.includes(safeDelta), "Awful Cases rAF delta clamp missing");
await fs.writeFile(GAME_PATH, game);

let main = await fs.readFile(MAIN_PATH, "utf8");
main = main.replace(
  /\n\s*awful-tool-preview\[project="awful-cases"\] \.runner-frame \{\n[\s\S]*?\n\s*\}\n/,
  "\n",
);
assert(!main.includes('awful-tool-preview[project="awful-cases"] .runner-frame'), "Legacy main runner-frame CSS remains");
assert(!main.includes("data-awful-frame-src"), "Legacy main iframe marker remains");
assert(!main.includes("data:text/html;charset=utf-8;base64"), "Legacy main embedded trainer remains");
await fs.writeFile(MAIN_PATH, main);

let standalone = await fs.readFile(STANDALONE_PATH, "utf8");
standalone = standalone.replace(
  /\n?\.runner-frame\{display:block;width:100%;height:100%;border:0;background:#007a7a;color-scheme:light\}\n?/,
  "\n",
);
assert(!standalone.includes(".runner-frame{"), "Legacy standalone runner-frame CSS remains");
assert(!standalone.includes("data-awful-frame-src"), "Legacy standalone iframe marker remains");
assert(!standalone.includes("data:text/html;charset=utf-8;base64"), "Legacy standalone embedded trainer remains");
await fs.writeFile(STANDALONE_PATH, standalone);

console.log("Awful Cases finalized: non-negative frame delta and legacy iframe CSS removed.");
