import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const checkOnly = process.argv.includes("--check");
const pairs = [
  ["src/components/awful-cases-core.js", "public/pets/awful-cases/awful-cases-core.js"],
  ["src/components/awful-cases-content.js", "public/pets/awful-cases/awful-cases-content.js"],
  ["src/components/awful-cases-runtime.js", "public/pets/awful-cases/awful-cases.js"],
];

for (const [sourcePath, targetPath] of pairs) {
  const source = await readFile(resolve(sourcePath), "utf8");
  if (checkOnly) {
    let target = null;
    try {
      target = await readFile(resolve(targetPath), "utf8");
    } catch {}
    if (target !== source) throw new Error(`${targetPath} is not synced from ${sourcePath}`);
    continue;
  }
  await mkdir(dirname(resolve(targetPath)), { recursive: true });
  await writeFile(resolve(targetPath), source, "utf8");
  console.log(`synced ${targetPath}`);
}
