import { appendFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CMS_PUBLICATION_CLASS = Object.freeze({
  CMS_CONTENT: "CMS_CONTENT",
  CMS_MEDIA: "CMS_MEDIA",
  CMS_GENERATED: "CMS_GENERATED",
  ENGINEERING: "ENGINEERING",
  UNKNOWN: "UNKNOWN",
});

const {
  CMS_CONTENT,
  CMS_MEDIA,
  CMS_GENERATED,
  ENGINEERING,
  UNKNOWN,
} = CMS_PUBLICATION_CLASS;

const FIXED_CMS_CONTENT = new Set([
  "src/content/navigation.json",
  "src/content/projects.json",
  "src/content/client-logo-visibility.json",
  "src/content/cv.json",
  "src/content/editorial/cv.json",
  "src/content/editorial/home-project-cards.json",
  "src/content/cases/jestei-pool.json",
  "src/content/cases/styx.json",
  "src/content/cases/sensetique.json",
  "src/content/collections/shootings.json",
  "src/content/standalone-projects/berry-social-content-2020.json",
  "src/content/standalone-projects/awful-cases.json",
  "src/content/visibility/jestei-pool.json",
  "src/content/visibility/styx.json",
  "src/content/visibility/sensetique.json",
  "src/content/visibility/shootings.json",
]);

const CMS_CONTENT_COLLECTIONS = [
  /^src\/content\/shootings\/[^/]+\.json$/,
  /^src\/content\/media-catalog\/registered\/[^/]+\.json$/,
  /^src\/content\/media-catalog\/uploads\/[^/]+\.json$/,
];

const CMS_MEDIA_PATTERNS = [
  /^public\/media\/projects\/index\/[^/]+\.webp$/i,
  /^public\/media\/catalog\/[^/]+\.(?:avif|gif|jpe?g|png|webp|m4v|mov|mp4|webm)$/i,
];

const CMS_GENERATED_FILES = new Set([
  "src/data/media/catalog-records.generated.ts",
  "public/media/generated/responsive-manifest.json",
  "public/media/generated/video-inventory.json",
  "src/data/media/responsive-generated.ts",
]);

const TOP_LEVEL_ENGINEERING = [
  /^\.pages\.yml$/,
  /^\.github\//,
  /^\.agents\//,
  /^tools\//,
  /^package(?:-lock)?\.json$/,
  /^vite\.config(?:\.[^/]+)?$/,
  /^tsconfig[^/]*\.json$/,
  /^(?:test|tests)\//,
  /^docs\//,
  /^AGENTS\.md$/,
  /^README(?:\.[^/]+)?$/i,
  /^\.editorconfig$/,
  /^\.git(?:ignore|attributes)$/,
  /^(?:index|404)\.html$/,
  /^work\//,
  /^shootings\//,
];

function normalizePath(value) {
  return String(value ?? "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/{2,}/g, "/");
}

export function classifyCmsPublicationPath(input) {
  const file = normalizePath(input);
  if (!file) return UNKNOWN;

  if (FIXED_CMS_CONTENT.has(file) || CMS_CONTENT_COLLECTIONS.some((pattern) => pattern.test(file))) {
    return CMS_CONTENT;
  }
  if (CMS_MEDIA_PATTERNS.some((pattern) => pattern.test(file))) return CMS_MEDIA;
  if (CMS_GENERATED_FILES.has(file)) return CMS_GENERATED;

  // Unconfigured authored content deliberately remains UNKNOWN so adding a file
  // below src/content does not grant that file CMS publication rights.
  if (file.startsWith("src/content/")) return UNKNOWN;

  if (file.startsWith("src/") || TOP_LEVEL_ENGINEERING.some((pattern) => pattern.test(file))) {
    return ENGINEERING;
  }
  return UNKNOWN;
}

const CLASSIFICATION_ORDER = [CMS_CONTENT, CMS_MEDIA, CMS_GENERATED, ENGINEERING, UNKNOWN];

export function classifyCmsPublicationFiles(inputs) {
  const paths = [...new Set((inputs ?? []).map(normalizePath).filter(Boolean))].sort();
  const files = paths.map((file) => ({
    path: file,
    classification: classifyCmsPublicationPath(file),
  }));
  const classifications = CLASSIFICATION_ORDER.filter((classification) =>
    files.some((file) => file.classification === classification),
  );
  const blocked = files.filter(({ classification }) =>
    classification === ENGINEERING || classification === UNKNOWN,
  );
  return {
    files,
    classifications,
    safe: blocked.length === 0,
    blocked,
  };
}

export function formatCmsPublicationSummary(result) {
  const lines = [
    "## CMS publication scope",
    "",
    result.safe ? "CMS publication scope: ALLOW" : "CMS publication blocked.",
    "",
    "### Safe CMS files",
  ];
  const safe = result.files.filter(({ classification }) =>
    classification === CMS_CONTENT || classification === CMS_MEDIA || classification === CMS_GENERATED,
  );
  if (safe.length === 0) lines.push("- none");
  else for (const item of safe) lines.push(`- \`${item.path}\` — ${item.classification}`);

  lines.push("", "### Blocked engineering files");
  const engineering = result.files.filter(({ classification }) => classification === ENGINEERING);
  if (engineering.length === 0) lines.push("- none");
  else for (const item of engineering) lines.push(`- \`${item.path}\``);

  lines.push("", "### Unknown files");
  const unknown = result.files.filter(({ classification }) => classification === UNKNOWN);
  if (unknown.length === 0) lines.push("- none");
  else for (const item of unknown) lines.push(`- \`${item.path}\``);

  if (!result.safe) {
    lines.push(
      "",
      "### Action",
      "Use the normal engineering release workflow. CMS publication cannot authorize this diff.",
    );
  }
  return `${lines.join("\n")}\n`;
}

function argumentValue(args, name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const filesPath = argumentValue(args, "--files");
  if (!filesPath) throw new Error("Usage: node tools/cms-publication-scope.mjs --files <json-file>");
  const values = JSON.parse(readFileSync(filesPath, "utf8"));
  if (!Array.isArray(values)) throw new Error("CMS publication file input must be a JSON array");
  const result = classifyCmsPublicationFiles(values);
  console.log(JSON.stringify(result, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, formatCmsPublicationSummary(result));
  }
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `safe=${result.safe}\nblocked_count=${result.blocked.length}\n`,
    );
  }
  if (!result.safe) process.exitCode = 1;
}
