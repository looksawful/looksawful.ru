import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("strict motion runtime is isolated from site interaction code", async () => {
  assert.equal(existsSync(new URL("../src/motion.ts", import.meta.url)), true, "src/motion.ts must exist");

  const [motion, interactive, main] = await Promise.all([
    read("src/motion.ts"),
    read("src/interactive.js"),
    read("src/main.js"),
  ]);

  assert.match(motion, /export function initMotion/);
  assert.match(motion, /from "\.\/motion-contract\.ts"/);
  assert.doesNotMatch(motion, /ScrollTrigger|gsap\.from\(/);
  assert.doesNotMatch(motion, /MutationObserver|ResizeObserver/);
  assert.doesNotMatch(motion, /addEventListener\(\s*["']scroll["']/);
  assert.doesNotMatch(motion, /\binnerWidth\b|\binnerHeight\b/);
  assert.equal(motion.match(/new IntersectionObserver/g)?.length, 2);
  assert.match(motion, /Map<HTMLElement, Map<RevealKind, HTMLElement\[\]>>/);
  assert.match(motion, /REVEAL_RAIL_ATTRIBUTE/);
  assert.match(motion, /CLEAR_REVEAL_PROPS\s*=\s*"opacity,visibility,transform,translate,scale"/);

  assert.doesNotMatch(
    interactive,
    /ScrollTrigger|initGsapMotionLayer|createViewportReveal|getTextRevealTargets|initStaticMediaReveals|data-hero-motion|figure\.media|project-card/,
  );

  assert.match(main, /import \{\s*initMotion,\s*\} from "\.\/motion\.ts";/s);
  assert.match(main, /destroys\.push\(\s*initMotion\(\{\s*root: document,\s*\}\),\s*\);/s);
  assert.match(main, /destroys\.push\(\s*initSiteInteractive\(\{\s*root: document,\s*\}\),\s*\);/s);
  assert.doesNotMatch(main, /initSiteInteractive\(\{\s*root: document,\s*motion\s*\}\)/);
});

test("motion contract exports the renderer attribute vocabulary", async () => {
  assert.equal(
    existsSync(new URL("../src/motion-contract.ts", import.meta.url)),
    true,
    "src/motion-contract.ts must exist",
  );

  const source = await read("src/motion-contract.ts");

  assert.match(source, /REVEAL_KINDS\s*=\s*\[\s*"copy",\s*"media",\s*"card",\s*\] as const/s);
  assert.match(source, /export type RevealKind/);
  assert.match(source, /REVEAL_ATTRIBUTE\s*=\s*"data-reveal"/);
  assert.match(source, /REVEAL_GROUP_ATTRIBUTE\s*=\s*"data-reveal-group"/);
  assert.match(source, /REVEAL_RAIL_ATTRIBUTE\s*=\s*"data-reveal-rail"/);
  assert.match(source, /renderRevealAttribute/);
  assert.match(source, /renderRevealGroupAttribute/);
  assert.match(source, /renderRevealRailAttribute/);
});

test("motion CSS owns first-paint hero entrance in the motion cascade layer", async () => {
  const [indexCss, motionCss, componentsCss] = await Promise.all([
    read("src/styles/index.css"),
    read("src/styles/motion.css"),
    read("src/styles/components.css"),
  ]);

  assert.match(
    indexCss,
    /@layer reset, tokens, colors, base, patterns, components, captions, motion, utilities;/,
  );
  assert.match(indexCss, /@import "\.\/motion\.css"\s+layer\(motion\);/);

  assert.match(motionCss, /@starting-style/);
  assert.doesNotMatch(motionCss, /@keyframes hero-text-enter|project-card__media img/);

  assert.doesNotMatch(componentsCss, /transform:\s*scale\(1\.025\)/);
  assert.doesNotMatch(componentsCss, /project-card:is\(:hover, :focus-visible\) \.project-card__media img/);
});
