import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const read = (name) => fs.existsSync(file(name)) ? fs.readFileSync(file(name), "utf8") : "";
const exists = (name) => fs.existsSync(file(name));

const indexCss = read("src/styles/index.css");
const roundCss = read("src/styles/modules/refactor-round3-typography.css");
const fit = read("src/components/fit-showcase-headings.js");
const html = read("index.html");

const checks = [
  ["round3 css exists", exists("src/styles/modules/refactor-round3-typography.css")],
  ["round3 css imported", indexCss.includes("refactor-round3-typography.css")],
  ["project type token", roundCss.includes("--type-role-project")],
  ["chapter type token", roundCss.includes("--type-role-chapter")],
  ["section type token", roundCss.includes("--type-role-section")],
  ["block type token", roundCss.includes("--type-role-block")],
  ["filter scoped out from typography override", roundCss.includes(".playlist-filter-embed")],
  ["pet preview scoped out from typography override", roundCss.includes(".pet-preview")],
  ["fit headings narrowed", fit.includes("round3FitAllowed") && fit.includes("FIT_SELECTOR")],
];

const count = (text, re) => (text.match(re) || []).length;
const metrics = {
  titleDisplayRefs: count(html, /title--display/g),
  titleXlRefs: count(html, /title--xl/g),
  titleLgRefs: count(html, /title--lg/g),
  caseChapterHeadingRefs: count(html, /case-chapter-heading/g),
  sectionHeadRefs: count(html, /section-head/g),
  blockHeaderRefs: count(html, /block__header/g),
  textBlockRefs: count(html, /text-block/g),
  typographyCssBytes: Buffer.byteLength(roundCss),
};

let out = "# refactor round 3 typography audit\n\n## checks\n";
let failed = false;
for (const [name, ok] of checks) {
  out += `- ${ok ? "ok" : "fail"}: ${name}\n`;
  if (!ok) failed = true;
}
out += "\n## metrics\n";
for (const [key, value] of Object.entries(metrics)) out += `- ${key}: ${value}\n`;
out += "\n## next high-risk areas\n";
out += "- media-group migration still needs data-media-layout cleanup.\n";
out += "- canvas/visual lifecycle still needs shared-runtime verification.\n";
out += "- playlist filter is still a monolith and should be split after runtime stabilization.\n";
out += "- policy book still needs partial/document extraction after the main section cleanup.\n";

fs.writeFileSync(file("_awful-refactor-round3-audit.md"), out);
console.log(out);
if (failed) process.exit(1);