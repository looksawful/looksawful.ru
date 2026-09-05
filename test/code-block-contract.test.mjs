import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_BLOCK_TYPES } from "../src/content/contracts/content-block.ts";
import { renderContentBlock } from "../src/site/renderers/entity/content-block.ts";

test("code-block is a first-class ContentBlock rendered through the canonical boundary", () => {
  assert.equal(CONTENT_BLOCK_TYPES.includes("code-block"), true);

  const html = renderContentBlock({
    type: "code-block",
    data: {
      title: "Install <safe>",
      code: 'git clone <repo> && echo "x&y"',
      description: "Clone & run <locally>",
      language: "shell",
    },
  });

  assert.match(html, /class="code-block"/);
  assert.match(html, /data-code-block/);
  assert.match(html, /data-code-copy/);
  assert.match(html, /data-code-language="shell"/);
  assert.match(html, /data-code-copy-button/);
  assert.match(html, /data-code-source/);
  assert.match(html, /Install &lt;safe&gt;/);
  assert.match(html, /git clone &lt;repo&gt; &amp;&amp; echo &quot;x&amp;y&quot;/);
  assert.match(html, /Clone &amp; run &lt;locally&gt;/);
  assert.doesNotMatch(html, /<safe>|<repo>|<locally>/);
});

test("code-block keeps optional metadata optional", () => {
  const html = renderContentBlock({
    type: "code-block",
    data: {
      code: "echo ok",
    },
  });

  assert.match(html, /<pre><code[^>]*data-code-source[^>]*>echo ok<\/code><\/pre>/);
  assert.doesNotMatch(html, /code-block__title/);
  assert.doesNotMatch(html, /code-block__meta/);
  assert.doesNotMatch(html, /data-code-language=/);
});
