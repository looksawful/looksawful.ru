import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
const backupRoot = path.join(root, "tools", "portfolio-media-position-backups", stamp);

const files = [
  "src/styles/modules/portfolio-system.css",
  "src/styles/modules/portfolio-gallery.css",
  "src/visuals/dom/portfolio-gallery.js",
  "src/styles/index.css",
  "src/main.js",
];

function abs(file) {
  return path.join(root, file);
}

function backup(file) {
  const source = abs(file);
  if (!existsSync(source)) return;
  const target = path.join(backupRoot, file);
  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(source, target);
}

for (const file of files) backup(file);

const systemCss = readFileSync(new URL("../src/styles/modules/portfolio-system.css", import.meta.url), "utf8");
const galleryCss = readFileSync(new URL("../src/styles/modules/portfolio-gallery.css", import.meta.url), "utf8");
const galleryJs = readFileSync(new URL("../src/visuals/dom/portfolio-gallery.js", import.meta.url), "utf8");

writeFileSync(abs("src/styles/modules/portfolio-system.css"), systemCss, "utf8");
writeFileSync(abs("src/styles/modules/portfolio-gallery.css"), galleryCss, "utf8");
writeFileSync(abs("src/visuals/dom/portfolio-gallery.js"), galleryJs, "utf8");

const indexCssPath = abs("src/styles/index.css");
let indexCss = readFileSync(indexCssPath, "utf8");
if (!indexCss.includes('@import "./modules/portfolio-gallery.css";') && !indexCss.includes("@import './modules/portfolio-gallery.css';")) {
  indexCss = `${indexCss.trimEnd()}\n@import "./modules/portfolio-gallery.css";\n`;
}
writeFileSync(indexCssPath, indexCss, "utf8");

const mainPath = abs("src/main.js");
let main = readFileSync(mainPath, "utf8");
if (!main.includes("./visuals/dom/portfolio-gallery.js")) {
  const marker = "if (has(\"[data-portfolio-toc]\"))";
  const insert = `if (has("#showcase [data-lightbox-item], #showcase [data-lightbox-video]")) {\n    tasks.push(\n      safe("portfolioGallery", async () => {\n        const module = await import("./visuals/dom/portfolio-gallery.js");\n        return module.initPortfolioGallery(document);\n      }),\n    );\n  }\n\n  `;
  main = main.includes(marker) ? main.replace(marker, insert + marker) : main.replace("await Promise.allSettled(tasks);", insert + "await Promise.allSettled(tasks);");
}
writeFileSync(mainPath, main, "utf8");

console.log(`portfolio media layout fixed`);
console.log(`backup: ${backupRoot}`);
