/**
 * compress-media.js
 *
 * Конвертирует PNG/JPG → WebP в папках с медиа для canvas-анимаций.
 * Исходники сохраняются в _media-originals/ (в .gitignore).
 *
 * Запуск: node scripts/compress-media.js
 * Опции:
 *   --dry-run     только показать что будет сделано, не изменять файлы
 *   --quality=80  качество WebP (по умолчанию 80)
 *   --max-size=800 максимальная сторона в пикселях (по умолчанию 800)
 *   --force       перезаписывать уже существующие WebP
 */

import sharp from "sharp";
import { existsSync, mkdirSync, copyFileSync, unlinkSync, readdirSync, statSync } from "fs";
import { join, extname, basename, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");

// Папки с медиа для анимаций
const MEDIA_DIRS = [
  "src/lab/assets/projects/jestei/media/arc",
  "src/lab/assets/projects/jestei/media/masonry",
  "src/lab/assets/projects/jestei/media/spiral",
  "src/lab/assets/projects/jestei/media/carousel",
  "src/lab/assets/cv/media/horizontal",
  "src/lab/assets/cv/media/diagonal",
  "src/lab/assets/cv/media/arc",
  "src/lab/assets/cv/media/masonry",
  "src/lab/assets/cv/logos/media/horizontal",
  "src/lab/assets/cv/logos/media/carousel",
];

const ORIGINALS_DIR = join(ROOT, "_media-originals");
const CONVERTIBLE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const QUALITY = Number(args.find((a) => a.startsWith("--quality="))?.split("=")[1] || 80);
const MAX_SIZE = Number(args.find((a) => a.startsWith("--max-size="))?.split("=")[1] || 800);

let converted = 0;
let skipped = 0;
let errors = 0;
let backedUp = 0;

const log = (...args) => console.log("[compress]", ...args);
const warn = (...args) => console.warn("[compress] ⚠", ...args);
const ok = (...args) => console.log("[compress] ✓", ...args);

const ensureDir = (dir) => {
  if (!existsSync(dir)) {
    if (!DRY_RUN) mkdirSync(dir, { recursive: true });
    log(`Создана папка: ${relative(ROOT, dir)}`);
  }
};

const backupFile = (srcPath) => {
  const rel = relative(ROOT, srcPath);
  const dest = join(ORIGINALS_DIR, rel);
  ensureDir(dirname(dest));

  if (!existsSync(dest)) {
    if (!DRY_RUN) copyFileSync(srcPath, dest);
    backedUp++;
    log(`Бэкап: ${rel}`);
  }
};

const convertFile = async (srcPath) => {
  const ext = extname(srcPath).toLowerCase();

  if (!CONVERTIBLE_EXTENSIONS.has(ext)) {
    return;
  }

  const dir = dirname(srcPath);
  const base = basename(srcPath, ext);
  const destPath = join(dir, `${base}.webp`);

  if (!FORCE && existsSync(destPath)) {
    skipped++;
    return;
  }

  try {
    backupFile(srcPath);

    if (!DRY_RUN) {
      await sharp(srcPath)
        .resize(MAX_SIZE, MAX_SIZE, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: QUALITY, effort: 4 })
        .toFile(destPath);

      // Удаляем оригинал после успешной конвертации
      unlinkSync(srcPath);
    }

    converted++;
    const sizeBefore = statSync(DRY_RUN ? srcPath : destPath).size;
    ok(
      `${relative(ROOT, srcPath)} → ${base}.webp${DRY_RUN ? " (dry)" : ` (${Math.round(sizeBefore / 1024)} KB)`}`
    );
  } catch (err) {
    errors++;
    warn(`Ошибка при конвертации ${srcPath}: ${err.message}`);
  }
};

const processDir = async (dirPath) => {
  if (!existsSync(dirPath)) {
    log(`Папка не найдена, пропускаю: ${relative(ROOT, dirPath)}`);
    return;
  }

  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await processDir(fullPath);
    } else if (entry.isFile()) {
      await convertFile(fullPath);
    }
  }
};

const main = async () => {
  console.log("\n=== compress-media ===");
  console.log(`Режим: ${DRY_RUN ? "DRY RUN (без изменений)" : "ЗАПИСЬ"}`);
  console.log(`Качество WebP: ${QUALITY}`);
  console.log(`Максимальный размер: ${MAX_SIZE}px`);
  console.log(`Перезаписывать существующие WebP: ${FORCE ? "да" : "нет"}`);
  console.log("=====================\n");

  ensureDir(ORIGINALS_DIR);

  for (const dir of MEDIA_DIRS) {
    const fullDir = join(ROOT, dir);
    log(`Обрабатываю: ${dir}`);
    await processDir(fullDir);
  }

  console.log("\n=== Итог ===");
  console.log(`Конвертировано: ${converted}`);
  console.log(`Пропущено (уже webp): ${skipped}`);
  console.log(`Бэкапов создано: ${backedUp}`);
  console.log(`Ошибок: ${errors}`);
  console.log("============\n");
};

main().catch((err) => {
  console.error("Критическая ошибка:", err);
  process.exit(1);
});
