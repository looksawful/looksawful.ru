import { readFile, writeFile } from "node:fs/promises";

const htmlPath = "index.html";
const cssPath = "src/components/sensetique-case/sensetique-case.css";

let html = await readFile(htmlPath, "utf8");
const watermarkPattern = /<div\b(?=[^>]*\bclass="[^"]*\bsensetique-section-watermark\b[^"]*")[^>]*>\s*<img\b[^>]*>\s*<\/div>/g;
const watermarks = html.match(watermarkPattern) ?? [];
if (watermarks.length === 0) {
  throw new Error("Sensetique watermark nodes were not found in source HTML.");
}
html = html.replace(watermarkPattern, "");
if (html.includes("sensetique-section-watermark")) {
  throw new Error("Sensetique watermark markup remains after cleanup.");
}
await writeFile(htmlPath, html, "utf8");

let css = await readFile(cssPath, "utf8");

css = css.replace(
  /\.cv-item--sensetique \.studio-structured,\s*\.cv-item--sensetique \.production-materials\s*\{[^}]*\}\s*/g,
  "",
);
css = css.replace(
  /\.cv-item--sensetique \.studio-structured > :not\(\.sensetique-section-watermark\),\s*\.cv-item--sensetique \.production-materials > :not\(\.sensetique-section-watermark\)\s*\{[^}]*\}\s*/g,
  "",
);
css = css.replace(
  /\.cv-item--sensetique \.sensetique-section-watermark\s*\{[^}]*\}\s*/g,
  "",
);
css = css.replace(
  /\.cv-item--sensetique \.sensetique-section-watermark img\s*\{[^}]*\}\s*/g,
  "",
);

const surfaceRule = `.cv-item--sensetique {\n  --item-body-bg: var(--item-bg);\n}\n\n.cv-item--sensetique .cv-item__body {\n  background: var(--item-bg);\n}\n\n`;
if (!css.includes("--item-body-bg: var(--item-bg)")) {
  css = css.replace(
    /^(\/\*[^\n]*\*\/\s*)/,
    `$1\n${surfaceRule}`,
  );
}

if (css.includes("sensetique-section-watermark")) {
  throw new Error("Sensetique watermark CSS remains after cleanup.");
}
if (!css.includes("--item-body-bg: var(--item-bg)")) {
  throw new Error("Sensetique body surface override was not installed.");
}

await writeFile(cssPath, css, "utf8");
console.log(`Removed ${watermarks.length} Sensetique watermark nodes and restored the sheet background to --item-bg.`);
