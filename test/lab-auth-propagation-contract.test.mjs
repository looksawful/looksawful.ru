import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflowUrl = new URL("../.github/workflows/lab-preview.yml", import.meta.url);

test("immutable Lab auth probe retries only safe propagation states and rejects anonymous exposure", async () => {
  const workflow = await readFile(workflowUrl, "utf8");
  const start = workflow.indexOf("Verify Basic Auth on immutable deployment");
  const end = workflow.indexOf("Verify immutable Lab entry and design system");
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const verification = workflow.slice(start, end);

  assert.match(verification, /auth_ready=0/);
  assert.match(verification, /for attempt in \{1\.\.20\}/);
  assert.match(verification, /anonymous_status/);
  assert.match(verification, /\[\[ "\$anonymous_status" =~ \^\[23\] \]\]/);
  assert.match(verification, /anonymous access bypassed Lab authentication/);
  assert.match(verification, /"\$anonymous_status" == "401"/);
  assert.match(verification, /WWW-Authenticate/i);
  assert.match(verification, /Basic realm=\\?"looksawful lab/);
  assert.match(verification, /"\$anonymous_status" == "000"/);
  assert.match(verification, /"\$anonymous_status" == "404"/);
  assert.match(verification, /"\$anonymous_status" =~ \^5/);
  assert.match(verification, /sleep 3/);
  assert.match(verification, /if \[\[ "\$auth_ready" != "1" \]\]/);
  assert.match(verification, /did not converge to fail-closed Basic Auth/);
});
