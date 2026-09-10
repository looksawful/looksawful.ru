import { readFileSync } from "node:fs";

const STYLE_OWNERS = Object.freeze({
  "site-navigation": Object.freeze({
    path: "src/styles/site-navigation.css",
  }),
});

export function getStyleOwner(name) {
  const owner = STYLE_OWNERS[name];
  if (!owner) throw new Error(`unknown style owner: ${name}`);
  return owner;
}

export function readStyleOwner(name) {
  const owner = getStyleOwner(name);
  const stylesheet = readFileSync(new URL(`../../${owner.path}`, import.meta.url), "utf8");

  if (!owner.start) {
    return { path: owner.path, source: stylesheet };
  }

  const start = stylesheet.indexOf(owner.start);
  if (start < 0) {
    throw new Error(`style owner ${name} is missing start marker in ${owner.path}`);
  }

  const end = owner.end ? stylesheet.indexOf(owner.end, start) : -1;
  if (owner.end && end < 0) {
    throw new Error(`style owner ${name} is missing end marker in ${owner.path}`);
  }

  return {
    path: owner.path,
    source: stylesheet.slice(start, end > start ? end : stylesheet.length),
  };
}
