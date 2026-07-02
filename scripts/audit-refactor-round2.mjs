import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), "utf8") : "";
const index = read("index.html");
const mounts = read("src/runtime/mounts.js");
const cssIndex = read("src/styles/index.css");
const petCss = read("src/styles/modules/pet-preview-round2.css");
const petJs = read("src/visuals/dom/pet-previews.js");

const count = (text, pattern) => (text.match(pattern) || []).length;
const checks = [
  ["main pet iframes removed", count(index, /<iframe[^>]+src=["']\/pets\//gi) === 0],
  ["pets preview section", /pets--preview/.test(index)],
  ["pet preview articles", count(index, /data-pet-preview=/g) >= 3],
  ["legacy pet slide headers removed", !/pet-page-slide__header/.test(index)],
  ["pet preview js exists", /initPetPreviews/.test(petJs)],
  ["pet preview css imported", /pet-preview-round2\.css/.test(cssIndex)],
  ["pet preview mount registered", /petPreviews/.test(mounts)],
  ["berserk audio preview", /data-berserk-play/.test(index)],
  ["cases internal preview", /cases-mini-game/.test(index)],
  ["audit internal preview", /audit-terminal/.test(index)],
];

const metrics = {
  petIframes: count(index, /<iframe[^>]+src=["']\/pets\//gi),
  petPreviewArticles: count(index, /data-pet-preview=/g),
  petPageSlides: count(index, /pet-page-slide/g),
  legacyPetHeaders: count(index, /pet-page-slide__header/g),
  petCssBytes: Buffer.byteLength(petCss),
  petJsBytes: Buffer.byteLength(petJs),
};

const lines = [];
lines.push("# refactor round 2 audit");
lines.push("");
lines.push("## checks");
for (const [label, ok] of checks) lines.push(`- ${ok ? "ok" : "fail"}: ${label}`);
lines.push("");
lines.push("## metrics");
for (const [key, value] of Object.entries(metrics)) lines.push(`- ${key}: ${value}`);
lines.push("");
lines.push("## next high-risk areas");
lines.push("- typography map and heading level reduction still need full structural migration.");
lines.push("- media-group migration still needs data-media-layout cleanup.");
lines.push("- playlist filter is still a monolith and should be split after runtime stabilization.");
lines.push("- policy book still needs partial/document extraction after the main section cleanup.");

const output = lines.join("\n") + "\n";
fs.writeFileSync(path.join(root, "_awful-refactor-round2-audit.md"), output);
console.log(output);

if (checks.some(([, ok]) => !ok)) process.exitCode = 1;