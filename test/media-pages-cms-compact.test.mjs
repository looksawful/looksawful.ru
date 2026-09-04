import assert from "node:assert/strict";
import test from "node:test";

import {
  compactRegisteredMediaCatalogCms,
  registeredMediaCatalogCmsBlock,
} from "../tools/media/compact-pages-cms-media-catalog.mjs";

test("registered Pages CMS collection exposes library defaults but no duplicated technical/project fields", () => {
  const source = `collections:\n  - name: media-library\n    items:\n      - name: registered-media-catalog\n        view:\n          fields: [title, mediaType, date]\n        fields:\n          - name: id\n          - name: mediaType\n          - name: src\n          - name: title\n          - name: projectIds\n          - name: tags\n      - name: uploaded-media-catalog\n        fields:\n          - name: mediaType\n          - name: src\n          - name: projectIds\n`;

  const next = compactRegisteredMediaCatalogCms(source);
  const block = registeredMediaCatalogCmsBlock(next);

  assert.match(block, /fields: \[title, date\]/);
  assert.match(block, /- name: title/);
  assert.match(block, /- name: tags/);
  assert.doesNotMatch(block, /- name: mediaType/);
  assert.doesNotMatch(block, /- name: src/);
  assert.doesNotMatch(block, /- name: projectIds/);

  assert.match(next, /- name: uploaded-media-catalog[\s\S]*- name: mediaType/);
  assert.match(next, /- name: uploaded-media-catalog[\s\S]*- name: projectIds/);
});
