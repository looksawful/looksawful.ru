import { readFile, writeFile } from "node:fs/promises";

const target = new URL("./lib/cv-content.mjs", import.meta.url);
let source = await readFile(target, "utf8");

const helperAnchor = "function replaceExactlyOnce(html, pattern, replacer, label) {";
const helper = `function lowercaseFirstLetter(value) {\n  const text = String(value);\n  const match = text.match(/\\p{L}/u);\n  if (!match || match.index === undefined) return text;\n  const index = match.index;\n  return \`${"${text.slice(0, index)}${match[0].toLocaleLowerCase(\"ru-RU\")}${text.slice(index + match[0].length)}"}\`;\n}\n\n`;

if (!source.includes("function lowercaseFirstLetter(value)")) {
  if (!source.includes(helperAnchor)) throw new Error("helper anchor not found");
  source = source.replace(helperAnchor, `${helper}${helperAnchor}`);
}

const oldRender = "      return `<p>${titleHtml}${separator}${escapeHtml(text)}</p>`;";
const newRender = "      const bodyText = title && text ? lowercaseFirstLetter(text) : text;\n      return `<p>${titleHtml}${separator}${escapeHtml(bodyText)}</p>`;";

if (!source.includes(newRender)) {
  if (!source.includes(oldRender)) throw new Error("principle render anchor not found");
  source = source.replace(oldRender, newRender);
}

await writeFile(target, source, "utf8");
