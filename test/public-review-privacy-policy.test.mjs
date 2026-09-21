import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const workflowsDir = path.join(root, ".github/workflows");
const legacyWorkflow = path.join(workflowsDir, "pr-preview.yml");
const legacyCaptionWorkflow = path.join(workflowsDir, "caption-qa.yml");
const policyPath = path.join(root, "docs/agents/public-reporting.md");
const scanRoots = [
  workflowsDir,
  path.join(root, "tools"),
  path.join(root, "src/lab"),
];

const forbidden = [
  ["legacy public preview project", /looksawful-ru-preview/iu],
  ["public Pages preview hostname", /pages\.dev/iu],
  ["legacy public preview comment marker", /looksawful-cloudflare-pr-preview/iu],
];

async function textFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await textFiles(absolute));
      continue;
    }
    if (/\.(?:cjs|js|json|md|mjs|ts|yml|yaml)$/iu.test(entry.name)) files.push(absolute);
  }
  return files;
}

function topLevelBlock(source, key) {
  const lines = source.split(/\r?\n/u);
  const start = lines.findIndex((line) => new RegExp(`^${key}:\\s*$`, "u").test(line));
  if (start < 0) return "";
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line && !/^\s/u.test(line) && !/^#/u.test(line)) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

function jobsFromWorkflow(source) {
  const block = topLevelBlock(source, "jobs");
  const lines = block.split(/\r?\n/u);
  const jobs = [];
  let current = null;

  for (const line of lines) {
    const match = /^  ([A-Za-z0-9_-]+):\s*$/u.exec(line);
    if (match) {
      if (current) jobs.push(current);
      current = { name: match[1], lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) jobs.push(current);
  return jobs.map(({ name, lines: jobLines }) => ({ name, source: jobLines.join("\n") }));
}

function jobIfExpression(jobSource) {
  const lines = jobSource.split(/\r?\n/u);
  const start = lines.findIndex((line) => /^    if:\s*/u.test(line));
  if (start < 0) return "";
  const expression = [lines[start].replace(/^    if:\s*/u, "")];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^    [A-Za-z0-9_-]+:\s*/u.test(line)) break;
    expression.push(line.trim());
  }
  return expression.join(" ").replace(/^[>|+-]+\s*/u, "").trim();
}

function stripOuterParens(value) {
  let source = value.trim();
  while (source.startsWith("(") && source.endsWith(")")) {
    let depth = 0;
    let wraps = true;
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (char === "(") depth += 1;
      else if (char === ")") depth -= 1;
      if (depth === 0 && index < source.length - 1) {
        wraps = false;
        break;
      }
    }
    if (!wraps) break;
    source = source.slice(1, -1).trim();
  }
  return source;
}

function splitTopLevelBoolean(source, operator) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let start = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote && source[index - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0 && source.slice(index, index + operator.length) === operator) {
      parts.push(source.slice(start, index).trim());
      start = index + operator.length;
      index += operator.length - 1;
    }
  }

  if (parts.length === 0) return [source.trim()];
  parts.push(source.slice(start).trim());
  return parts;
}

function conditionDefinitelyFalseForEvent(expression, eventName) {
  const source = stripOuterParens(
    expression
      .replace(/^\$\{\{\s*/u, "")
      .replace(/\s*\}\}$/u, ""),
  );

  const orParts = splitTopLevelBoolean(source, "||");
  if (orParts.length > 1) {
    return orParts.every((part) => conditionDefinitelyFalseForEvent(part, eventName));
  }

  const andParts = splitTopLevelBoolean(source, "&&");
  if (andParts.length > 1) {
    return andParts.some((part) => conditionDefinitelyFalseForEvent(part, eventName));
  }

  if (/^github\.event\.schedule\s*==\s*['"][^'"]+['"]$/u.test(source)) return true;

  const match = /^github\.event_name\s*(==|!=)\s*['"]([^'"]+)['"]$/u.exec(source);
  if (!match) return false;
  const [, operator, expected] = match;
  return operator === "==" ? eventName !== expected : eventName === expected;
}

function pullRequestTriggerEvents(source) {
  const events = new Set();
  const firstLine = source.split(/\r?\n/u).find((line) => /^on:\s*/u.test(line));
  if (!firstLine) return events;

  const record = (value) => {
    const event = value.trim().replace(/^['"]|['"]$/gu, "");
    if (event === "pull_request" || event === "pull_request_target") events.add(event);
  };

  const inline = firstLine.replace(/^on:\s*/u, "").trim();
  if (inline) {
    if (inline.startsWith("[") && inline.endsWith("]")) {
      inline.slice(1, -1).split(",").forEach(record);
    } else {
      record(inline);
    }
    return events;
  }

  for (const line of topLevelBlock(source, "on").split(/\r?\n/u)) {
    const match = /^  (pull_request|pull_request_target):(?:\s|$)/u.exec(line);
    if (match) events.add(match[1]);
  }
  return events;
}

function jobCanRunOnPullRequest(jobSource, triggerEvents) {
  const expression = jobIfExpression(jobSource);
  if (!expression) return true;
  return [...triggerEvents].some(
    (eventName) => !conditionDefinitelyFalseForEvent(expression, eventName),
  );
}

test("pull-request trigger detection covers scalar, sequence, and target forms", () => {
  assert.deepEqual([...pullRequestTriggerEvents("on:\n  pull_request:\n")], ["pull_request"]);
  assert.deepEqual([...pullRequestTriggerEvents("on: pull_request\n")], ["pull_request"]);
  assert.deepEqual([...pullRequestTriggerEvents("on: [push, pull_request]\n")], ["pull_request"]);
  assert.deepEqual(
    [...pullRequestTriggerEvents("on:\n  pull_request_target:\n")],
    ["pull_request_target"],
  );
});

test("job condition analysis only excludes pull requests when the whole condition proves it", () => {
  const pullRequest = new Set(["pull_request"]);
  assert.equal(
    jobCanRunOnPullRequest(
      "    if: github.event_name != 'pull_request' || github.actor == 'OWNER'",
      pullRequest,
    ),
    true,
  );
  assert.equal(
    jobCanRunOnPullRequest(
      "    if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'",
      pullRequest,
    ),
    false,
  );
  assert.equal(
    jobCanRunOnPullRequest(
      "    if: github.event_name != 'pull_request' && github.actor == 'OWNER'",
      pullRequest,
    ),
    false,
  );
  assert.equal(
    jobCanRunOnPullRequest(
      "    if: github.event_name != 'pull_request'",
      new Set(["pull_request_target"]),
    ),
    true,
  );
  assert.equal(
    jobCanRunOnPullRequest(
      "    if: github.event.schedule == '37 1 * * *' || (github.event_name == 'workflow_dispatch' && inputs.suite == 'all')",
      pullRequest,
    ),
    false,
  );
});

test("public automation has no pre-production review publication path", async () => {
  await assert.rejects(access(legacyWorkflow), (error) => error?.code === "ENOENT");
  await assert.rejects(access(legacyCaptionWorkflow), (error) => error?.code === "ENOENT");

  const files = (await Promise.all(scanRoots.map(textFiles))).flat();
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(root, file).replaceAll(path.sep, "/");
    for (const [label, pattern] of forbidden) {
      assert.doesNotMatch(source, pattern, `${relative} reintroduces ${label}`);
    }
  }
});

test("pull-request workflows cannot publish visual-review evidence", async () => {
  const workflowFiles = (await readdir(workflowsDir))
    .filter((name) => /\.ya?ml$/u.test(name))
    .sort();

  const forbiddenInPrJobs = [
    ["public artifact upload", /actions\/upload-artifact@/iu],
    ["issue comment mutation", /github\.rest\.issues\.(?:create|update)Comment/iu],
    ["public Pages deployment", /(?:wrangler[^\n]*\bdeploy\b|\bpages\s+deploy\b|actions\/deploy-pages@|cloudflare\/wrangler-action@)/iu],
    ["public report mutation permission", /^    (?:contents|issues|pull-requests|pages|deployments):\s*write\s*$/mu],
    ["broad write permission", /^    permissions:\s*write-all\s*$/mu],
    ["GitHub comment CLI", /\bgh\s+(?:pr|issue)\s+comment\b/iu],
  ];

  for (const name of workflowFiles) {
    const source = await readFile(path.join(workflowsDir, name), "utf8");
    const triggerEvents = pullRequestTriggerEvents(source);
    if (triggerEvents.size === 0) continue;

    assert.doesNotMatch(
      topLevelBlock(source, "permissions"),
      /^  (?:contents|issues|pull-requests|pages|deployments):\s*write\s*$/mu,
      `${name} grants publication-capable permission on a pull-request workflow`,
    );
    assert.doesNotMatch(
      source,
      /^permissions:\s*write-all\s*$/mu,
      `${name} grants write-all on a pull-request workflow`,
    );

    for (const job of jobsFromWorkflow(source)) {
      if (!jobCanRunOnPullRequest(job.source, triggerEvents)) continue;
      for (const [label, pattern] of forbiddenInPrJobs) {
        assert.doesNotMatch(job.source, pattern, `${name}:${job.name} permits ${label} on pull requests`);
      }
    }
  }
});

test("public reporting policy keeps pre-production visual review private", async () => {
  const policy = await readFile(policyPath, "utf8");
  assert.match(policy, /production is the only public rendered version/iu);
  assert.match(policy, /pre-production.*must stay private/isu);
  assert.match(policy, /noindex.*does not make.*private/isu);
  assert.match(policy, /screenshots.*review manifests.*visual diffs/isu);
});
