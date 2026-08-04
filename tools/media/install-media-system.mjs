#!/usr/bin/env node
import { existsSync } from "node:fs";
import {
  copyFile,
  readFile,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

function parseArguments(argv) {
  const options = {
    root: process.cwd(),
    apply: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--root") options.root = argv[++index];
    else if (argument === "--apply") options.apply = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  options.root = path.resolve(options.root);
  return options;
}

function patchPackageJson(packageJson) {
  const next = structuredClone(packageJson);
  next.scripts ??= {};

  if (
    next.scripts.dev &&
    next.scripts.dev !== "node tools/media/dev-media.mjs" &&
    !next.scripts["dev:site"]
  ) {
    next.scripts["dev:site"] = next.scripts.dev;
  }

  if (
    next.scripts.build &&
    next.scripts.build !== "node tools/media/build-media.mjs" &&
    !next.scripts["build:site"]
  ) {
    next.scripts["build:site"] = next.scripts.build;
  }

  if (
    next.scripts["media:verify"] &&
    next.scripts["media:verify"] !==
      "node tools/media/verify-media-system.mjs --mode build" &&
    !next.scripts["media:legacy:verify"]
  ) {
    next.scripts["media:legacy:verify"] = next.scripts["media:verify"];
  }

  next.scripts.dev = "node tools/media/dev-media.mjs";
  next.scripts.build = "node tools/media/build-media.mjs";
  next.scripts["media:bootstrap:check"] =
    "node tools/media/bootstrap-media-sources.mjs";
  next.scripts["media:bootstrap"] =
    "node tools/media/bootstrap-media-sources.mjs --apply";
  next.scripts["media:prepare"] =
    "node tools/media/prepare-media.mjs";
  next.scripts["media:watch"] =
    "node tools/media/watch-media.mjs";
  next.scripts["media:annotate:check"] =
    "node tools/media/annotate-media-items.mjs";
  next.scripts["media:annotate"] =
    "node tools/media/annotate-media-items.mjs --apply";
  next.scripts["media:verify"] =
    "node tools/media/verify-media-system.mjs --mode build";
  next.scripts["media:verify:strict"] =
    "node tools/media/verify-media-system.mjs --mode strict";
  next.scripts["media:system:test"] =
    "node --test tools/media/tests/media-system-core.test.mjs";
  next.scripts["media:install"] =
    "node tools/media/install-media-system.mjs --apply";

  return next;
}

function appendManagedBlock(source, heading, lines) {
  if (source.includes(heading)) return source;

  const separator = source.endsWith("\n") || source.length === 0
    ? ""
    : "\n";

  return `${source}${separator}\n${heading}\n${lines.join("\n")}\n`;
}

function patchAgentsReadme(source) {
  if (source.includes("MEDIA_README.md")) return source;

  const line =
    "- `MEDIA_README.md` — повседневная работа с оригиналами и командами.\n" +
    "- `MEDIA_SYSTEM.md` — архитектура генерации, cache и manifest.\n" +
    "- `MEDIA_RULES.md` — обязательные инварианты и запреты.\n" +
    "- `MEDIA_ITEM_CONTRACT.md` — публичный контракт одного ассета.\n";

  const marker = "Актуальный минимальный набор документации проекта.\n";

  return source.includes(marker)
    ? source.replace(marker, `${marker}\n${line}`)
    : `${source.trimEnd()}\n\n${line}`;
}

function patchComponents(source) {
  if (source.includes("| Media Item |")) return source;

  const row =
    "| Media Item | `src/components/media-item/` | live | Один image/video asset, manifest-варианты, loading state, skeleton и caption. Не знает layout, Accordion или позицию. |\n";
  const mediaGalleryRow = /^(\| Media Gallery \|.*\n)/m;

  if (mediaGalleryRow.test(source)) {
    return source.replace(mediaGalleryRow, `$1${row}`);
  }

  return `${source.trimEnd()}\n\n${row}`;
}

function patchArchitecture(source) {
  let next = source;

  if (!next.includes("  media-item/")) {
    next = next.replace(
      /(\s+media-gallery\/\n)/,
      `$1  media-item/\n`,
    );
  }

  if (!next.includes("### Media Item")) {
    const section = `
### Media Item

\`src/components/media-item/\` владеет только одним image/video asset:

- непрозрачным media ID;
- собственными generated-вариантами;
- responsive \`srcset\`;
- loading/error state;
- skeleton;
- caption.

Компонент не знает проект, номер контейнера, позицию, layout, slider index или Accordion.

`;

    const marker = "### Media Gallery\n";

    next = next.includes(marker)
      ? next.replace(marker, `${section}${marker}`)
      : `${next.trimEnd()}\n${section}`;
  }

  return next;
}

async function writeIfChanged(filename, next, apply) {
  const current = existsSync(filename)
    ? await readFile(filename, "utf8")
    : "";

  if (current === next) return false;

  console.log(`${apply ? "update" : "would update"}: ${filename}`);

  if (apply) {
    await writeFile(filename, next, "utf8");
  }

  return true;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const packagePath = path.resolve(options.root, "package.json");
  const packageBackup = path.resolve(
    options.root,
    "package.before-media-system.json",
  );

  if (!existsSync(packagePath)) {
    throw new Error(`package.json not found: ${packagePath}`);
  }

  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const nextPackage = patchPackageJson(packageJson);

  if (options.apply && !existsSync(packageBackup)) {
    await copyFile(packagePath, packageBackup);
  }

  await writeIfChanged(
    packagePath,
    `${JSON.stringify(nextPackage, null, 2)}\n`,
    options.apply,
  );

  const gitignorePath = path.resolve(options.root, ".gitignore");
  const gitignore = existsSync(gitignorePath)
    ? await readFile(gitignorePath, "utf8")
    : "";
  const nextGitignore = appendManagedBlock(
    gitignore,
    "# Media System generated files",
    [
      ".cache/media/",
      "public/media/generated/",
      "src/generated/media-manifest.json",
      "src/generated/media-manifest.js",
    ],
  );

  await writeIfChanged(
    gitignorePath,
    nextGitignore,
    options.apply,
  );

  const agentsReadmePath = path.resolve(
    options.root,
    "Agents/README.md",
  );
  const agentsReadme = existsSync(agentsReadmePath)
    ? await readFile(agentsReadmePath, "utf8")
    : "# Agents\n";
  await writeIfChanged(
    agentsReadmePath,
    patchAgentsReadme(agentsReadme),
    options.apply,
  );

  const componentsPath = path.resolve(
    options.root,
    "Agents/COMPONENTS.md",
  );

  if (existsSync(componentsPath)) {
    const components = await readFile(componentsPath, "utf8");
    await writeIfChanged(
      componentsPath,
      patchComponents(components),
      options.apply,
    );
  }

  const architecturePath = path.resolve(
    options.root,
    "Agents/ARCHITECTURE.md",
  );

  if (existsSync(architecturePath)) {
    const architecture = await readFile(architecturePath, "utf8");
    await writeIfChanged(
      architecturePath,
      patchArchitecture(architecture),
      options.apply,
    );
  }

  if (!options.apply) {
    console.log("Dry run only. Re-run with --apply.");
  } else {
    console.log("Media System project integration installed.");
  }
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
