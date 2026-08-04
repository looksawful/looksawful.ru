#!/usr/bin/env node
import { existsSync } from "node:fs";
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  addClassName,
  parseTagAttributes,
  setTagAttribute,
} from "./media-system-core.mjs";
import { MEDIA_PATHS } from "./media.config.mjs";

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

function updateAssetTag(tag, entry, { legacyRoot = false } = {}) {
  let result = addClassName(tag, "media-item__asset");
  result = setTagAttribute(result, "data-media-asset");
  result = setTagAttribute(result, "data-media-id", entry.id);
  result = setTagAttribute(result, "src", entry.default.src);

  if (entry.default.width) {
    result = setTagAttribute(result, "width", String(entry.default.width));
  }

  if (entry.default.height) {
    result = setTagAttribute(result, "height", String(entry.default.height));
  }

  if (entry.type === "image") {
    result = setTagAttribute(result, "decoding", "async");

    if (!parseTagAttributes(result).has("loading")) {
      result = setTagAttribute(result, "loading", "lazy");
    }
  } else if (entry.poster?.src) {
    result = setTagAttribute(result, "poster", entry.poster.src);
  }

  if (legacyRoot) {
    result = setTagAttribute(result, "data-media-item");
    result = setTagAttribute(result, "data-media-type", entry.type);
    result = setTagAttribute(result, "data-media-source-ratio", entry.ratio);
    result = setTagAttribute(result, "data-media-state", "idle");
  }

  return result;
}

function annotateFigure(figure, entries, counters) {
  const openMatch = /^<figure\b[^>]*>/i.exec(figure);
  if (!openMatch) return figure;

  const openTag = openMatch[0];
  const mediaMatches = [
    ...figure.matchAll(
      /<(img|video)\b[^>]*\bdata-media-id\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/gi,
    ),
  ];

  if (mediaMatches.length !== 1) {
    return figure.replace(
      /<(img|video)\b[^>]*\bdata-media-id\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/gi,
      (tag, _type, doubleId, singleId) => {
        const id = doubleId ?? singleId;
        const entry = entries[id];

        if (!entry) {
          counters.unknown.add(id);
          return tag;
        }

        counters.legacy += 1;
        return updateAssetTag(tag, entry, { legacyRoot: true });
      },
    );
  }

  const id = mediaMatches[0][2] ?? mediaMatches[0][3];
  const entry = entries[id];

  if (!entry) {
    counters.unknown.add(id);
    return figure;
  }

  let nextOpen = addClassName(openTag, "media-item");
  nextOpen = setTagAttribute(nextOpen, "data-media-item");
  nextOpen = setTagAttribute(nextOpen, "data-media-id", entry.id);
  nextOpen = setTagAttribute(nextOpen, "data-media-type", entry.type);
  nextOpen = setTagAttribute(
    nextOpen,
    "data-media-source-ratio",
    entry.ratio,
  );
  nextOpen = setTagAttribute(nextOpen, "data-media-state", "idle");

  let next = nextOpen + figure.slice(openTag.length);
  next = next.replace(mediaMatches[0][0], (tag) => {
    const asset = updateAssetTag(tag, entry);

    if (/data-media-surface/i.test(next)) {
      return asset;
    }

    return `<div class="media-item__surface" data-media-surface>${asset}</div>`;
  });

  if (!/<figcaption\b/i.test(next)) {
    next = next.replace(
      /<\/figure>\s*$/i,
      '<figcaption class="media-item__caption" data-media-caption hidden></figcaption></figure>',
    );
  } else {
    next = next.replace(
      /<figcaption\b[^>]*>/i,
      (tag) => {
        let caption = addClassName(tag, "media-item__caption");
        caption = setTagAttribute(caption, "data-media-caption");
        return caption;
      },
    );
  }

  counters.figures += 1;
  return next;
}

function annotateLooseMedia(html, entries, counters) {
  return html.replace(
    /<(img|video)\b[^>]*\bdata-media-id\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/gi,
    (tag, _type, doubleId, singleId) => {
      if (/\bdata-media-asset\b/i.test(tag)) return tag;

      const id = doubleId ?? singleId;
      const entry = entries[id];

      if (!entry) {
        counters.unknown.add(id);
        return tag;
      }

      counters.legacy += 1;
      return updateAssetTag(tag, entry, { legacyRoot: true });
    },
  );
}

function ensureIndexImports(html) {
  let result = html;

  if (!result.includes("src/components/media-item/media-item.css")) {
    result = result.replace(
      /<\/head>/i,
      '<link href="./src/components/media-item/media-item.css" rel="stylesheet"/>\n</head>',
    );
  }

  if (!result.includes("src/components/media-item/media-item.js")) {
    result = result.replace(
      /<\/body>/i,
      '<script type="module" src="./src/components/media-item/media-item.js"></script>\n</body>',
    );
  }

  return result;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const indexPath = path.resolve(options.root, MEDIA_PATHS.index);
  const manifestPath = path.resolve(
    options.root,
    MEDIA_PATHS.manifestJson,
  );
  const backupPath = path.resolve(
    options.root,
    "index.before-media-item.html",
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const entries = manifest.entries ?? {};
  const original = await readFile(indexPath, "utf8");
  const counters = {
    figures: 0,
    legacy: 0,
    unknown: new Set(),
  };

  let next = original.replace(
    /<figure\b[^>]*>[\s\S]*?<\/figure>/gi,
    (figure) => annotateFigure(figure, entries, counters),
  );

  next = annotateLooseMedia(next, entries, counters);
  next = ensureIndexImports(next);

  console.log(`Canonical figure media items: ${counters.figures}`);
  console.log(`Legacy direct media items: ${counters.legacy}`);
  console.log(`Unknown media ids: ${counters.unknown.size}`);

  if (counters.unknown.size) {
    for (const id of [...counters.unknown].sort()) {
      console.error(`unknown media id: ${id}`);
    }

    process.exitCode = 2;
    return;
  }

  if (!options.apply) {
    console.log("Dry run only. Re-run with --apply to update index.html.");
    return;
  }

  if (!existsSync(backupPath)) {
    await copyFile(indexPath, backupPath);
  }

  await writeFile(indexPath, next, "utf8");
  console.log(`Updated: ${indexPath}`);
  console.log(`Backup: ${backupPath}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
