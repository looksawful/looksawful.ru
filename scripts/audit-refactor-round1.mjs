import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), "utf8") : "";
const exists = (file) => fs.existsSync(path.join(root, file));
const count = (text, re) => (text.match(re) || []).length;

const files = {
  main: read("src/main.js"),
  components: read("src/components/index.js"),
  styles: read("src/styles/index.css"),
  roundCss: read("src/styles/modules/refactor-round1.css"),
  mediaSlider: read("src/visuals/dom/media-slider.js"),
  html: read("index.html"),
};

const checks = [
  ["runtime entry", files.main.includes("./runtime/init-runtime.js")],
  ["mount registry file", exists("src/runtime/mounts.js")],
  ["mount engine file", exists("src/runtime/mount-engine.js")],
  ["round1 css imported", files.styles.includes("refactor-round1.css")],
  ["mobile header-only css", files.roundCss.includes(".site-header__chips") && files.roundCss.includes("display: none")],
  ["compact rail css", files.roundCss.includes("grid-auto-columns: minmax(8.5rem, 54vw)")],
  ["before-after direct duplicate removed", !files.components.includes("initShowcaseBeforeAfter")],
  ["media slider auto-init removed", !files.mediaSlider.includes("DOMContentLoaded") || !files.mediaSlider.includes("initMediaSliders();\n  });")],
];

const metrics = {
  petIframes: count(files.html, /<iframe[\s\S]*?src="\/pets\//g),
  mediaGroups: count(files.html, /class="[^"]*media-group/g),
  mobileRailsLegacy: count(files.html, /media-group--mobile-rail|data-mobile-layout="rail"/g),
  portfolioToc: count(files.html, /data-portfolio-toc|portfolio-toc/g),
  siteHeaderComponentAttr: count(files.html, /data-component="site-header"/g),
};

const lines = [];
lines.push("# refactor round 1 audit");
lines.push("");
lines.push("## checks");
for (const [name, ok] of checks) {
  lines.push(`- ${ok ? "ok" : "fail"}: ${name}`);
}
lines.push("");
lines.push("## metrics");
for (const [name, value] of Object.entries(metrics)) {
  lines.push(`- ${name}: ${value}`);
}
lines.push("");
lines.push("## next high-risk areas");
lines.push("- pet iframes on the main page still need replacement with internal preview components.");
lines.push("- typography map and media map still need full structural migration, not only CSS overrides.");
lines.push("- playlist filter is still a monolith and should be split after runtime stabilization.");

const output = lines.join("\n") + "\n";
fs.writeFileSync(path.join(root, "_awful-refactor-round1-audit.md"), output);
console.log(output);

if (checks.some(([, ok]) => !ok)) {
  process.exitCode = 1;
}