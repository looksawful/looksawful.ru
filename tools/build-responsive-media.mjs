import { access, mkdir, readFile, rm } from 'node:fs/promises';
import { dirname, extname, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VARIANT_WIDTHS = [480, 960, 1600];
const RASTER_EXTENSIONS = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp']);
const TEMP_PUBLIC_DIR = 'public/media-responsive';

function attributeValue(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] ?? '';
}

function replaceAttribute(tag, name, value) {
  const pattern = new RegExp(`\\s+${name}\\s*=\\s*(["']).*?\\1`, 'i');
  const attribute = ` ${name}="${value}"`;
  if (pattern.test(tag)) return tag.replace(pattern, attribute);
  return tag.replace(/\s*\/?>$/, (ending) => `${attribute}${ending}`);
}

function cleanMediaPath(src) {
  const clean = String(src).split(/[?#]/, 1)[0].replace(/\\/g, '/');
  if (clean.startsWith('./media/')) return clean.slice(2);
  if (clean.startsWith('/media/')) return clean.slice(1);
  if (clean.startsWith('media/')) return clean;
  return '';
}

function isRasterSource(src) {
  const mediaPath = cleanMediaPath(src);
  return mediaPath && RASTER_EXTENSIONS.has(extname(mediaPath).toLowerCase());
}

export function getVariantWidths(sourceWidth) {
  const width = Number(sourceWidth);
  if (!Number.isFinite(width) || width <= 0) return [];
  return VARIANT_WIDTHS.filter((candidate) => candidate < width * 0.85);
}

export function collectExcludedRanges(html) {
  const ranges = [];
  const patterns = [
    /<!--[\s\S]*?-->/g,
    /<template\b[^>]*data-disabled-section(?:\s*=\s*(["']).*?\1)?[^>]*>[\s\S]*?<\/template>/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      ranges.push([match.index, match.index + match[0].length]);
    }
  }

  return ranges.sort((a, b) => a[0] - b[0]);
}

export function isExcludedOffset(offset, ranges) {
  return ranges.some(([start, end]) => offset >= start && offset < end);
}

export function getResponsiveUrl(src, width) {
  const mediaPath = cleanMediaPath(src);
  if (!mediaPath) return '';
  const info = parse(mediaPath);
  return `/media-responsive/${info.dir.replace(/^media\/?/, '')}/${info.name}-${width}.webp`;
}

function responsiveOutputPath(publicDir, src, width) {
  const url = getResponsiveUrl(src, width);
  return resolve(publicDir, url.replace(/^\/media-responsive\//, ''));
}

export function addResponsiveAttributes(tag, { srcset, sizes }) {
  let next = replaceAttribute(tag, 'srcset', srcset);
  next = replaceAttribute(next, 'sizes', sizes);
  return next;
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolveSourceFile(repoRoot, src) {
  const mediaPath = cleanMediaPath(src);
  if (!mediaPath) return null;

  const candidates = [
    resolve(repoRoot, mediaPath),
    resolve(repoRoot, 'public', mediaPath),
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  return null;
}

function activeImageMatches(html) {
  const excluded = collectExcludedRanges(html);
  return [...html.matchAll(/<img\b[^>]*>/gi)].filter(
    (match) => !isExcludedOffset(match.index, excluded),
  );
}

function sizesForTag(tag) {
  return attributeValue(tag, 'loading').toLowerCase() === 'lazy'
    ? 'auto, 100vw'
    : '100vw';
}

async function prepareResponsiveMarkup({ repoRoot, sourceHtml, tempPublicDir, sharp }) {
  const matches = activeImageMatches(sourceHtml);
  const generated = new Map();
  let variantCount = 0;
  let responsiveImageCount = 0;
  let cursor = 0;
  let output = '';

  for (const match of matches) {
    const tag = match[0];
    const src = attributeValue(tag, 'src');
    output += sourceHtml.slice(cursor, match.index);
    cursor = match.index + tag.length;

    if (!isRasterSource(src)) {
      output += tag;
      continue;
    }

    const sourceFile = await resolveSourceFile(repoRoot, src);
    if (!sourceFile) {
      output += tag;
      continue;
    }

    let info = generated.get(sourceFile);
    if (!info) {
      const metadata = await sharp(sourceFile).metadata();
      const sourceWidth = Number(metadata.width);
      if (!Number.isFinite(sourceWidth) || sourceWidth <= 0) {
        output += tag;
        continue;
      }

      const variants = [];
      for (const width of getVariantWidths(sourceWidth)) {
        const outputPath = responsiveOutputPath(tempPublicDir, src, width);
        await mkdir(dirname(outputPath), { recursive: true });
        await sharp(sourceFile)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82, effort: 4 })
          .toFile(outputPath);
        variants.push({ width, url: getResponsiveUrl(src, width) });
        variantCount += 1;
      }

      info = { sourceWidth, variants };
      generated.set(sourceFile, info);
    }

    const candidates = [
      ...info.variants.map(({ url, width }) => `${url} ${width}w`),
      `${src} ${info.sourceWidth}w`,
    ];

    output += addResponsiveAttributes(tag, {
      srcset: candidates.join(', '),
      sizes: sizesForTag(tag),
    });
    responsiveImageCount += 1;
  }

  output += sourceHtml.slice(cursor);
  return { html: output, responsiveImageCount, variantCount, sourceCount: generated.size };
}

function responsiveMediaHtmlPlugin(indexPath, html) {
  return {
    name: 'looksawful-responsive-media-html',
    enforce: 'pre',
    transformIndexHtml(source, context) {
      return context?.filename === indexPath ? html : source;
    },
  };
}

export async function buildResponsiveMedia({ repoRoot = process.cwd() } = {}) {
  const indexPath = resolve(repoRoot, 'index.html');
  const aboutPath = resolve(repoRoot, 'about/index.html');
  const tempPublicDir = resolve(repoRoot, TEMP_PUBLIC_DIR);
  const sourceHtml = await readFile(indexPath, 'utf8');

  if (await fileExists(tempPublicDir)) {
    throw new Error(`${TEMP_PUBLIC_DIR} already exists; refusing to overwrite it.`);
  }

  const [{ default: sharp }, { build }] = await Promise.all([
    import('sharp'),
    import('vite'),
  ]);

  let prepared;
  try {
    await mkdir(tempPublicDir, { recursive: true });
    prepared = await prepareResponsiveMarkup({
      repoRoot,
      sourceHtml,
      tempPublicDir,
      sharp,
    });

    const input = {
      main: indexPath,
    };

    if (await fileExists(aboutPath)) {
      input.about = aboutPath;
    }

    await build({
      build: {
        rollupOptions: {
          input,
        },
      },
      plugins: [
        responsiveMediaHtmlPlugin(indexPath, prepared.html),
      ],
    });
  } finally {
    await rm(tempPublicDir, { recursive: true, force: true });
  }

  console.log(
    `[responsive-media] ${prepared.responsiveImageCount} images, ${prepared.sourceCount} sources, ${prepared.variantCount} generated variants`,
  );
}

const isDirectRun = process.argv[1]
  && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isDirectRun) {
  await buildResponsiveMedia();
}
