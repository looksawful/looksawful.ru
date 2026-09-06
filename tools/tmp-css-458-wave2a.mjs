import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../src/styles/components.css", import.meta.url);
let css = await readFile(path, "utf8");

function removeRuleOnce(source, selector, predicate = () => true) {
  const marker = `${selector} {`;
  const starts = [];
  let offset = 0;
  while (true) {
    const index = source.indexOf(marker, offset);
    if (index === -1) break;
    if ((index === 0 || source[index - 1] === "\n") && predicate(source, index)) starts.push(index);
    offset = index + marker.length;
  }
  if (starts.length !== 1) {
    throw new Error(`Expected exactly one ${selector} rule, found ${starts.length}`);
  }

  const start = starts[0];
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = -1;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) throw new Error(`Unclosed ${selector} rule`);

  let consumeEnd = end;
  while (source[consumeEnd] === "\n") consumeEnd += 1;
  return source.slice(0, start) + source.slice(consumeEnd);
}

const before = css;

css = removeRuleOnce(css, ".expertise");
css = removeRuleOnce(css, ".experience");
css = removeRuleOnce(
  css,
  "@container page-section (width > 44rem)",
  (source, index) => {
    const sample = source.slice(index, index + 1400);
    return sample.includes(".expertise li {") && sample.includes(".experience li {");
  },
);

if (!css.includes(".expertise,\n.experience,\n.projects-grid,\n.portfolio-showcase,\n.tools {")) {
  throw new Error("Shared page-section foundation was altered");
}

for (const forbidden of [
  ".expertise {\n  & ol",
  ".experience {\n  & ol",
  ".expertise li {",
  ".expertise h3 {",
  ".expertise li > p {",
  ".experience li {",
  ".experience h3,",
]) {
  if (css.includes(forbidden)) throw new Error(`Legacy owner remains: ${forbidden}`);
}

if (css === before) throw new Error("Transform produced no change");

await writeFile(path, css, "utf8");

const beforeLines = before.split("\n").length;
const afterLines = css.split("\n").length;
console.log(`Wave 2A transform: ${beforeLines} -> ${afterLines} lines, removed ${before.length - css.length} bytes`);
