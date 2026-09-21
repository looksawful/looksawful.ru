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

function jobCanRunOnPullRequest(jobSource) {
  const expression = jobIfExpression(jobSource);
  if (!expression) return true;
  if (/github\.event_name\s*!=\s*['"]pull_request['"]/u.test(expression)) return false;

  const positiveEvents = [...expression.matchAll(/github\.event_name\s*==\s*['"]([^'"]+)['"]/gu)]
    .map((match) => match[1]);
  if (positiveEvents.length > 0 && !positiveEvents.includes("pull_request")) return false;

  return true;
}

function workflowHasPullRequestTrigger(source) {
  return /^  pull_request:\s*$/mu.test(topLevelBlock(source, "on"));
}

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
    ["public Pages deployment", /(?:wrangler[^\n]*\bdeploy\b|\bpages\s+deploy\b|actions\/deploy-pages@)/iu],
    ["public report mutation permission", /^    (?:issues|pull-requests):\s*write\s*$/mu],
    ["GitHub comment CLI", /\bgh\s+(?:pr|issue)\s+comment\b/iu],
  ];

  for (const name of workflowFiles) {
    const source = await readFile(path.join(workflowsDir, name), "utf8");
    if (!workflowHasPullRequestTrigger(source)) continue;

    assert.doesNotMatch(
      topLevelBlock(source, "permissions"),
      /^  (?:issues|pull-requests):\s*write\s*$/mu,
      `${name} grants public-report mutation permission on a pull-request workflow`,
    );

    for (const job of jobsFromWorkflow(source)) {
      if (!jobCanRunOnPullRequest(job.source)) continue;
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
