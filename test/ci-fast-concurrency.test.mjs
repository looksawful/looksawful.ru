import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workflow = () =>
  readFile(new URL("../.github/workflows/ci-fast.yml", import.meta.url), "utf8");

test("Fast CI cancels stale revisions within the same pull request", async () => {
  const source = await workflow();

  assert.match(
    source,
    /group: fast-ci-\$\{\{ github\.workflow \}\}-\$\{\{ github\.event_name == 'pull_request' && github\.event\.pull_request\.number/,
  );
  assert.match(
    source,
    /cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}/,
  );
});

test("Fast CI isolates manual and called runs from the push concurrency group", async () => {
  const source = await workflow();

  assert.match(
    source,
    /group: fast-ci-\$\{\{ github\.workflow \}\}-\$\{\{ github\.event_name == 'pull_request' && github\.event\.pull_request\.number \|\| github\.event_name == 'push' && github\.ref \|\| github\.run_id \}\}/,
  );
  assert.doesNotMatch(source, /queue:/);
});

test("Fast CI follows prod-first branch authority and ignores archival dev", async () => {
  const source = await workflow();

  assert.match(source, /push:\s*\n\s*branches:\s*\[prod\]/);
  assert.match(source, /pull_request:\s*\n\s*branches:\s*\[prod\]/);
  assert.doesNotMatch(source, /branches:\s*\[[^\]]*dev[^\]]*\]/);
});
