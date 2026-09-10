import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { normalizeCaptionText } from "../src/components/caption-trust.ts";
import { escapeHtml } from "../src/utils/html.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const maliciousLookingCopy = `
  caption <script>alert("x")</script>
  <img src=x onerror="boom()">
  <a href="javascript:alert(1)">link</a>
`;

test("plain caption copy remains text data rather than executable markup", () => {
  const normalized = normalizeCaptionText(maliciousLookingCopy);
  const escaped = escapeHtml(normalized);

  assert.equal(
    normalized,
    'caption <script>alert("x")</script> <img src=x onerror="boom()"> <a href="javascript:alert(1)">link</a>',
  );
  assert.doesNotMatch(escaped, /<script\b|<img\b|<a\b/i);
  assert.match(escaped, /&lt;script&gt;/);
  assert.match(escaped, /onerror=&quot;boom\(\)&quot;/);
  assert.match(escaped, /href=&quot;javascript:alert\(1\)&quot;/);
});

test("lightbox keeps plain text and trusted internal markup on separate DOM paths", async () => {
  const facade = await read("src/components/media-lightbox.ts");

  assert.match(facade, /normalizeCaptionText\(supplemental\?\.textContent\)/);
  assert.match(facade, /node\.textContent\s*=\s*text/);
  assert.match(facade, /normalizeCaptionText\(line\.textContent\)/);
  assert.match(facade, /host\.textContent\s*=\s*text/);

  assert.match(facade, /host\.append\(child\.cloneNode\(true\)\)/);
  assert.match(facade, /return host\.innerHTML/);

  assert.doesNotMatch(facade, /supplemental\?\.innerHTML/);
  assert.doesNotMatch(facade, /node\.innerHTML\s*=\s*text/);
  assert.doesNotMatch(facade, /host\.innerHTML\s*=\s*text/);
});

test("authored caption fields are escaped before entering trusted page markup", async () => {
  const template = await read("src/templates/media-figure.ts");

  assert.match(template, /escapeHtml\(caption\.title\)/);
  assert.match(template, /escapeHtml\(caption\.text\)/);
  assert.match(template, /escapeHtml\(item\)/);

  assert.match(template, /class="media__title"/);
  assert.match(template, /class="media__text"/);
  assert.match(template, /class="media__meta"/);
});
