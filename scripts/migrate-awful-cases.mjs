import fs from "node:fs/promises";

const PREVIEW_PATH = "src/components/awful-tools-preview/awful-tools-preview.js";
const MAIN_PATH = "index.html";
const STANDALONE_PATH = "public/pets/awful-cases/index.html";
const GAME_PATH = "public/pets/awful-cases/awful-cases.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const preview = await fs.readFile(PREVIEW_PATH, "utf8");
const fixedPreview = preview.replace(
  'pending = import("/pets/awful-cases/awful-cases.js")',
  'pending = import(/* @vite-ignore */ "/pets/awful-cases/awful-cases.js")',
);
assert(
  fixedPreview.includes('import(/* @vite-ignore */ "/pets/awful-cases/awful-cases.js")'),
  "Awful Cases public module import is not Vite-safe",
);
if (fixedPreview !== preview) await fs.writeFile(PREVIEW_PATH, fixedPreview);

const [main, standalone, game] = await Promise.all([
  fs.readFile(MAIN_PATH, "utf8"),
  fs.readFile(STANDALONE_PATH, "utf8"),
  fs.readFile(GAME_PATH, "utf8"),
]);

for (const [name, html] of [[MAIN_PATH, main], [STANDALONE_PATH, standalone]]) {
  assert(html.includes("data-awful-cases"), `${name}: direct Awful Cases markup missing`);
  assert(!html.includes("data-awful-frame-src"), `${name}: legacy lazy iframe marker remains`);
  assert(!html.includes("data:text/html;charset=utf-8;base64"), `${name}: embedded trainer payload remains`);
}

assert(game.includes("export function enhanceAwfulCases(root)"), "Direct game runtime export missing");
assert(!game.includes("data:image/png;base64"), "Embedded PNG payload remains in game runtime");

console.log("Awful Cases direct component verified; Vite public-module boundary normalized.");
