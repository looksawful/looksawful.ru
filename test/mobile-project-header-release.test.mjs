import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const stylesheetPath = "src/styles/project-header.css";
const styleIndexPath = "src/styles/index.css";

test("prod compact project header release keeps only role and period metadata", () => {
  assert.equal(
    existsSync(stylesheetPath),
    true,
    "prod must contain the scoped project-header stylesheet",
  );

  const stylesheet = readFileSync(stylesheetPath, "utf8");
  const styleIndex = readFileSync(styleIndexPath, "utf8");

  assert.match(
    styleIndex,
    /@import\s+"\.\/project-header\.css"\s+layer\(components\);/,
    "the scoped stylesheet must be loaded in the existing components layer",
  );
  assert.match(
    stylesheet,
    /@container\s+project\s+\(width\s*<=\s*50rem\)/,
    "compact behavior must stay container-scoped",
  );
  assert.match(
    stylesheet,
    /grid-template-areas:\s*"role period"/,
    "compact header must preserve role and period metadata",
  );
  assert.match(
    stylesheet,
    /\.project__name,\s*\.project__head\s*>\s*img\s*\{\s*display:\s*none;/s,
    "compact header must hide repeated text and logo identity",
  );
});
