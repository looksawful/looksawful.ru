import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const primitivesUrl = new URL("src/styles/primitives.css", root);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("action controls have one shared production CSS contract", () => {
  assert.equal(existsSync(primitivesUrl), true, "primitives.css must exist");
  const css = read("src/styles/primitives.css");
  const index = read("src/styles/index.css");

  assert.equal(
    index.split('@import "./primitives.css" layer(components);').length - 1,
    1,
  );
  assert.match(css, /\.action-control\s*\{/);
  assert.match(css, /appearance:\s*none/);
  assert.match(css, /color:\s*inherit/);
  assert.match(css, /font:\s*inherit/);
  assert.match(css, /touch-action:\s*manipulation/);
  assert.match(css, /cursor:\s*pointer/);
});

test("representative production actions compose the shared action control", () => {
  const consent = read("src/components/site-analytics-consent.ts");
  const codeBlock = read("src/components/content/code-block.ts");
  const resources = read("src/components/composition/resource-links.ts");
  const contactHub = read("src/components/contact-form-hub.ts");

  assert.match(
    consent,
    /className = "action-control site-analytics-consent__button"/,
  );
  assert.match(consent, /dataset\.emphasis = value === "granted" \? "primary" : "quiet"/);
  assert.match(codeBlock, /class="action-control code-block__copy"/);
  assert.match(resources, /class="action-control resource-row__action"/);
  assert.match(
    contactHub,
    /className = "action-control contact-form-hub__text-action"/,
  );
  assert.match(
    contactHub,
    /className = "action-control contact-form-hub__text-action contact-form-hub__submit"/,
  );
  assert.match(
    contactHub,
    /className = "action-control contact-form-hub-launcher"/,
  );
});
