import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const indexCssPath = path.join(root, "src/styles/index.css");
const backupRoot = path.join(root, "tools/portfolio-reading-backups", timestamp());
const importLine = '@import "./modules/portfolio-reading.css";';

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function backup(filePath) {
  if (!fs.existsSync(filePath)) return;
  const relative = path.relative(root, filePath);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
}

if (!fs.existsSync(indexCssPath)) {
  throw new Error(`index css not found: ${indexCssPath}`);
}

backup(indexCssPath);
backup(path.join(root, "src/styles/modules/portfolio-reading.css"));

let css = fs.readFileSync(indexCssPath, "utf8");
css = css
  .split(/\r?\n/)
  .filter((line) => !line.includes("portfolio-reading.css"))
  .join("\n")
  .trimEnd();

const lines = css.split("\n");
const preferredIndex = lines.findIndex((line) => line.includes("portfolio-structure.css"));
if (preferredIndex >= 0) {
  lines.splice(preferredIndex + 1, 0, importLine);
} else {
  let lastImport = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*@import\s+/.test(lines[i])) lastImport = i;
  }
  lines.splice(lastImport + 1, 0, importLine);
}

fs.writeFileSync(indexCssPath, `${lines.join("\n").trimEnd()}\n`, "utf8");

console.log("portfolio reading typography connected");
console.log(`backup: ${backupRoot}`);
