import { readFile, writeFile } from "node:fs/promises";
import { parseHTML } from "linkedom";
import postcss from "postcss";

const htmlPath = "index.html";
const cssPath = "src/components/cv-sheets/cv-sheets.css";

const htmlSource = await readFile(htmlPath, "utf8");
const { document } = parseHTML(htmlSource);

const projectsBefore = [...document.querySelectorAll("#cv .cv-item__project")].map((node) =>
  node.textContent.replace(/\s+/g, " ").trim(),
);
const itemCountBefore = document.querySelectorAll("#cv .cv-item[data-cv-scene]").length;

const alwaysHiddenSelectors = [
  ".cv-item__meta[hidden]",
  ".cv-item .brief[hidden]",
  ".cv-item .principle[hidden]",
  ".cv-item .category-browser[hidden]",
  ".cv-item .jestei-theme-organism-shell__header[hidden]",
  ".cv-item__content > .cv-story .cv-story__copy[hidden]",
  ".cv-item__intro > .cv-story__copy > h1[hidden]",
  ".cv-item__intro > .cv-story__copy > h2[hidden]",
  ".cv-item__intro > .cv-story__copy > h3[hidden]",
  ".cv-item__intro > .cv-story__copy > h4[hidden]",
  ".cv-item__intro > .cv-story__copy > h5[hidden]",
  ".cv-item__intro > .cv-story__copy > h6[hidden]",
  ".cv-item__intro > .cv-story__copy > p[hidden]",
  ".cv-story--workflow-pile .counter-list > [hidden]",
];

let removedNodes = 0;
for (const selector of alwaysHiddenSelectors) {
  document.querySelectorAll(selector).forEach((node) => {
    node.remove();
    removedNodes += 1;
  });
}

document.querySelectorAll(".cv-item__content > .cv-story[hidden]").forEach((section) => {
  if (section.children.length === 0 && !section.textContent.trim()) {
    section.remove();
    removedNodes += 1;
  }
});

// Headers and bodies are no longer disclosure controls. Remove stale linkage ids
// only when nothing in the document still references them.
for (const header of document.querySelectorAll("#cv .cv-item__header[id^='cv-trigger-']")) {
  const id = header.id;
  if (!document.querySelector(`[aria-labelledby="${id}"], [aria-controls="${id}"]`)) {
    header.removeAttribute("id");
  }
}
for (const body of document.querySelectorAll("#cv .cv-item__body[id^='cv-panel-']")) {
  const id = body.id;
  if (!document.querySelector(`[aria-labelledby="${id}"], [aria-controls="${id}"]`)) {
    body.removeAttribute("id");
  }
}

const projectsAfter = [...document.querySelectorAll("#cv .cv-item__project")].map((node) =>
  node.textContent.replace(/\s+/g, " ").trim(),
);
const itemCountAfter = document.querySelectorAll("#cv .cv-item[data-cv-scene]").length;
if (itemCountAfter !== itemCountBefore) throw new Error("CV sheet count changed during cleanup");
if (JSON.stringify(projectsAfter) !== JSON.stringify(projectsBefore)) {
  throw new Error("CV project order changed during cleanup");
}
if (document.querySelector("#cv .cv-item__body[hidden]")) {
  throw new Error("A CV sheet body became hidden during cleanup");
}
if (projectsAfter.filter((name) => name === "Sensetique").length !== 1) {
  throw new Error("Sensetique source integrity failed");
}

await writeFile(htmlPath, `<!doctype html>\n${document.documentElement.outerHTML}\n`, "utf8");

let cssSource = await readFile(cssPath, "utf8");
cssSource = cssSource.replace(
  /\/\*\s*\n\s*\* Обычные Scene получают исходные цветовые пары автоматически по кругу\.[\s\S]*?\*\/\s*\n\s*\.cv-item\[data-cv-theme="default"\]/,
  `/* data-cv-theme — единственный источник цветовой пары конкретного листа. */\n  .cv-item[data-cv-theme="default"]`,
);

const root = postcss.parse(cssSource);
root.walkRules((rule) => {
  if (rule.selector?.includes("data-resolved-mode")) rule.remove();
});
root.walkAtRules((rule) => {
  if (rule.nodes?.length === 0) rule.remove();
});

const arrowCss = `\n\n@layer components {\n  .cv-item__header::after {\n    content: "";\n    grid-area: arrow;\n    justify-self: end;\n    inline-size: 0.55rem;\n    block-size: 0.55rem;\n    border-inline-end: 0.125rem solid currentColor;\n    border-block-end: 0.125rem solid currentColor;\n    transform: rotate(-135deg);\n    transform-origin: center;\n  }\n}\n`;

let cleanedCss = root.toString().trim();
if (!cleanedCss.includes(".cv-item__header::after")) cleanedCss += arrowCss;
if (cleanedCss.includes("data-resolved-mode")) throw new Error("Stale accordion mode CSS remains");
if (!cleanedCss.includes('.cv-item[data-cv-theme="item-04"]')) {
  throw new Error("Explicit CV theme mapping was lost");
}
await writeFile(cssPath, `${cleanedCss.trim()}\n`, "utf8");

console.log(`Removed ${removedNodes} permanently hidden legacy nodes.`);
