import { appendFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

function runGit(repoRoot, args) {
  return execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" }).trim();
}

function gitStatus(repoRoot, args) {
  const result = spawnSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" });
  if (result.error) throw result.error;
  return result;
}

export function inspectCmsPublicationTopology({
  repoRoot = process.cwd(),
  prodRef = "origin/prod",
  devRef = "origin/dev",
} = {}) {
  const root = path.resolve(repoRoot);
  const prodSha = runGit(root, ["rev-parse", prodRef]);
  const devSha = runGit(root, ["rev-parse", devRef]);
  const prodTree = runGit(root, ["rev-parse", `${prodRef}^{tree}`]);
  const devTree = runGit(root, ["rev-parse", `${devRef}^{tree}`]);

  if (prodTree === devTree) {
    return {
      safe: true,
      nothingToPublish: true,
      mode: prodSha === devSha ? "identical-ref" : "identical-tree",
      prodSha,
      devSha,
      prodTree,
      devTree,
      mergedTree: devTree,
    };
  }

  const ancestor = gitStatus(root, ["merge-base", "--is-ancestor", prodRef, devRef]);
  if (ancestor.status === 0) {
    return {
      safe: true,
      nothingToPublish: false,
      mode: "linear-descendant",
      prodSha,
      devSha,
      prodTree,
      devTree,
      mergedTree: devTree,
    };
  }
  if (ancestor.status !== 1) {
    return {
      safe: false,
      nothingToPublish: false,
      mode: "topology-error",
      prodSha,
      devSha,
      prodTree,
      devTree,
      mergedTree: null,
      detail: (ancestor.stderr || ancestor.stdout || "git merge-base failed").trim(),
    };
  }

  const merge = gitStatus(root, ["merge-tree", "--write-tree", devRef, prodRef]);
  const mergedTree = (merge.stdout || "").trim().split(/\r?\n/, 1)[0] || null;

  if (merge.status !== 0 || !mergedTree || !/^[0-9a-f]{40,64}$/i.test(mergedTree)) {
    return {
      safe: false,
      nothingToPublish: false,
      mode: "diverged-conflict",
      prodSha,
      devSha,
      prodTree,
      devTree,
      mergedTree,
      detail: (merge.stderr || merge.stdout || "git merge-tree failed").trim(),
    };
  }

  if (mergedTree !== devTree) {
    return {
      safe: false,
      nothingToPublish: false,
      mode: "prod-content-not-in-dev",
      prodSha,
      devSha,
      prodTree,
      devTree,
      mergedTree,
    };
  }

  return {
    safe: true,
    nothingToPublish: false,
    mode: "history-diverged-content-aligned",
    prodSha,
    devSha,
    prodTree,
    devTree,
    mergedTree,
  };
}

export function formatCmsPublicationTopologySummary(result) {
  const lines = [
    "## CMS publication branch topology",
    "",
    `- prod: \`${result.prodSha}\``,
    `- dev: \`${result.devSha}\``,
    `- mode: \`${result.mode}\``,
  ];

  if (result.nothingToPublish) {
    lines.push("", "Nothing to publish: dev and prod have identical content trees.");
  } else if (result.safe) {
    lines.push(
      "",
      result.mode === "history-diverged-content-aligned"
        ? "Publication topology: ALLOW. Histories diverged only in a way that adds no production-only content when merged back into dev."
        : "Publication topology: ALLOW.",
    );
  } else {
    lines.push(
      "",
      "CMS publication blocked.",
      "",
      result.mode === "prod-content-not-in-dev"
        ? "prod contains content that a merge into dev would add. Synchronize dev before publishing."
        : "prod and dev cannot be proven content-aligned. Synchronize them through the normal engineering workflow before publishing.",
      "Use the normal engineering release workflow; do not bypass this guard.",
    );
    if (result.detail) lines.push("", `Git detail: ${result.detail}`);
  }

  return `${lines.join("\n")}\n`;
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const result = inspectCmsPublicationTopology({
    repoRoot: argumentValue(args, "--repo") ?? process.cwd(),
    prodRef: argumentValue(args, "--prod") ?? "origin/prod",
    devRef: argumentValue(args, "--dev") ?? "origin/dev",
  });

  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, formatCmsPublicationTopologySummary(result));
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `safe=${result.safe}\nnothing_to_publish=${result.nothingToPublish}\nmode=${result.mode}\nprod_sha=${result.prodSha}\ndev_sha=${result.devSha}\n`,
    );
  }
  if (!result.safe) process.exitCode = 1;
}
