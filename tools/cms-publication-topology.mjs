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
  sourceRef = "origin/cms-source",
} = {}) {
  const root = path.resolve(repoRoot);
  const prodSha = runGit(root, ["rev-parse", prodRef]);
  const sourceSha = runGit(root, ["rev-parse", sourceRef]);
  const prodTree = runGit(root, ["rev-parse", `${prodRef}^{tree}`]);
  const sourceTree = runGit(root, ["rev-parse", `${sourceRef}^{tree}`]);

  if (prodTree === sourceTree) {
    return {
      safe: true,
      nothingToPublish: true,
      mode: prodSha === sourceSha ? "identical-ref" : "identical-tree",
      prodSha,
      sourceSha,
      prodTree,
      sourceTree,
    };
  }

  const prodAncestor = gitStatus(root, ["merge-base", "--is-ancestor", prodRef, sourceRef]);
  if (prodAncestor.status === 0) {
    return {
      safe: true,
      nothingToPublish: false,
      mode: "linear-descendant",
      prodSha,
      sourceSha,
      prodTree,
      sourceTree,
    };
  }

  if (prodAncestor.status !== 1) {
    return {
      safe: false,
      nothingToPublish: false,
      mode: "topology-error",
      prodSha,
      sourceSha,
      prodTree,
      sourceTree,
      detail: (prodAncestor.stderr || prodAncestor.stdout || "git merge-base failed").trim(),
    };
  }

  const sourceAncestor = gitStatus(root, ["merge-base", "--is-ancestor", sourceRef, prodRef]);
  if (sourceAncestor.status === 0) {
    return {
      safe: false,
      nothingToPublish: false,
      mode: "source-stale",
      prodSha,
      sourceSha,
      prodTree,
      sourceTree,
    };
  }

  if (sourceAncestor.status !== 1) {
    return {
      safe: false,
      nothingToPublish: false,
      mode: "topology-error",
      prodSha,
      sourceSha,
      prodTree,
      sourceTree,
      detail: (sourceAncestor.stderr || sourceAncestor.stdout || "git merge-base failed").trim(),
    };
  }

  return {
    safe: false,
    nothingToPublish: false,
    mode: "source-diverged",
    prodSha,
    sourceSha,
    prodTree,
    sourceTree,
  };
}

export function formatCmsPublicationTopologySummary(result) {
  const lines = [
    "## CMS publication branch topology",
    "",
    `- prod: \`${result.prodSha}\``,
    `- source: \`${result.sourceSha}\``,
    `- mode: \`${result.mode}\``,
  ];

  if (result.nothingToPublish) {
    lines.push("", "Nothing to publish: the authoring source and prod have identical content trees.");
  } else if (result.safe) {
    lines.push("", "Publication topology: ALLOW. The temporary authoring source descends from current prod.");
  } else {
    lines.push("", "CMS publication blocked.", "");
    if (result.mode === "source-stale") {
      lines.push("The authoring source is stale because current prod has advanced. Reconcile onto a fresh prod-based content branch before publishing.");
    } else if (result.mode === "source-diverged") {
      lines.push("The authoring source and prod have diverged. Reconcile through a fresh prod-based content branch before publishing.");
    } else {
      lines.push("The authoring source topology could not be proven safe.");
    }
    lines.push("Do not bypass this guard.");
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
    sourceRef: argumentValue(args, "--source") ?? "origin/cms-source",
  });

  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, formatCmsPublicationTopologySummary(result));
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `safe=${result.safe}\nnothing_to_publish=${result.nothingToPublish}\nmode=${result.mode}\nprod_sha=${result.prodSha}\nsource_sha=${result.sourceSha}\n`,
    );
  }
  if (!result.safe) process.exitCode = 1;
}
