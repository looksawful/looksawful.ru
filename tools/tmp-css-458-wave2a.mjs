import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../src/styles/components.css", import.meta.url);
let css = await readFile(path, "utf8");

function removeExactOnce(source, block, label) {
  const first = source.indexOf(block);
  const last = source.lastIndexOf(block);
  if (first === -1) throw new Error(`Expected ${label} block was not found`);
  if (first !== last) throw new Error(`Expected exactly one ${label} block`);
  return source.slice(0, first) + source.slice(first + block.length);
}

const expertiseLegacy = `.expertise {
  & ol {
    counter-reset: expertise;
    border-block-start: var(--border-width-100) solid currentColor;
  }

  & li {
    counter-increment: expertise;
    display: grid;
    grid-template-columns: 2.5rem minmax(0, 1fr);
    gap: 0.35rem var(--size-300);
    padding-block: var(--size-300);
    border-block-end: var(--border-width-100) solid rgb(0 0 0 / 0.18);
  }

  & li::before {
    content: counter(expertise, decimal-leading-zero);
    grid-column: 1;
    grid-row: 1 / span 2;
    font-size: var(--fs-200);
    font-variant-numeric: tabular-nums;
  }

  & h3 {
    grid-column: 2;
    font-size: var(--fs-400);
    font-weight: var(--fw-600);
    line-height: 1.1;
  }

  & li > p {
    grid-column: 2;
    max-inline-size: 62ch;
    font-size: var(--fs-300);
  }
}

`;

const experienceLegacy = `.experience {
  & ol {
    border-block-start: var(--border-width-100) solid currentColor;
  }

  & li {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.35rem var(--size-200);
    padding-block: var(--size-300);
    border-block-end: var(--border-width-100) solid rgb(0 0 0 / 0.18);
  }

  & h3 {
    grid-column: 1 / 5;
    font-size: var(--fs-400);
    font-weight: var(--fw-600);
  }

  & li > p {
    grid-column: 2 / -1;
    font-size: var(--fs-300);
  }

  & li > p:last-child {
    grid-column: 5 / -1;
    grid-row: 1;
    justify-self: end;
    font-variant-numeric: tabular-nums;
    text-align: end;
  }
}

`;

const expertiseExperienceWideLegacy = `@container page-section (width > 44rem) {
  .expertise li {
    grid-template-columns: 3rem minmax(14rem, 0.75fr) minmax(0, 1.25fr);
    gap: var(--size-300) var(--size-400);

    &::before {
      grid-column: 1;
      grid-row: 1;
    }
  }

  .expertise h3 {
    grid-column: 2;
  }

  .expertise li > p {
    grid-column: 3;
  }

  .experience li {
    grid-template-columns: minmax(12rem, 0.7fr) minmax(0, 1.3fr) max-content;
    gap: var(--size-400);
    align-items: baseline;
  }

  .experience h3,
  .experience li > p,
  .experience li > p:last-child {
    grid-column: auto;
    grid-row: auto;
  }
}

`;

const before = css;
css = removeExactOnce(css, expertiseLegacy, "legacy expertise owner");
css = removeExactOnce(css, experienceLegacy, "legacy experience owner");
css = removeExactOnce(css, expertiseExperienceWideLegacy, "legacy expertise/experience wide owner");

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
