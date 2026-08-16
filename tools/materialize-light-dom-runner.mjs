import { writeFile } from "node:fs/promises";

await import("./materialize-light-dom.mjs");

await writeFile(
  "src/components/sensetique-case/scene.js",
  `export function prepareSensetiqueCase(root = document) {\n  return root.querySelector(".cv-item--sensetique");\n}\n`,
  "utf8",
);
