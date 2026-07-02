import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const exists = (name) => fs.existsSync(file(name));
const read = (name) => exists(name) ? fs.readFileSync(file(name), "utf8") : "";
const write = (name, text) => fs.writeFileSync(file(name), text, "utf8");

function patchPackageJson() {
  const packagePath = file("package.json");
  const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  pkg.scripts ||= {};

  if (pkg.scripts["audit:refactor"] && pkg.scripts["audit:refactor"] !== "node scripts/audit-refactor-step2-runtime.mjs") {
    pkg.scripts["audit:refactor:step1"] ||= "node scripts/audit-refactor-step1-inventory.mjs";
  }
  pkg.scripts["audit:refactor:final"] ||= "node scripts/audit-refactor-final.mjs";
  pkg.scripts["audit:refactor:step1"] ||= "node scripts/audit-refactor-step1-inventory.mjs";
  pkg.scripts["audit:refactor"] = "node scripts/audit-refactor-step2-runtime.mjs";

  write("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
}

function patchMountEngine() {
  const target = "src/runtime/mount-engine.js";
  let text = read(target);
  if (!text) throw new Error(`${target} not found`);

  const alreadySplit = text.includes('from "./schedule.js"') && text.includes('from "./visibility.js"');
  if (!alreadySplit) {
    text = text.replace(
      /import\s*\{\s*([^}]*?)\s*\}\s*from\s*["']\.\/dom\.js["'];/s,
      (match, names) => {
        const parts = names.split(",").map((name) => name.trim()).filter(Boolean);
        const domNames = parts.filter((name) => !["runAfterFirstPaint", "runWhenIdle", "runWhenNear"].includes(name));
        const lines = [];
        if (domNames.length) lines.push(`import { ${domNames.join(", ")} } from "./dom.js";`);
        lines.push('import { runAfterFirstPaint, runWhenIdle } from "./schedule.js";');
        lines.push('import { runWhenNear } from "./visibility.js";');
        return lines.join("\n");
      },
    );
  }

  if (!text.includes('from "./schedule.js"')) {
    text = `import { runAfterFirstPaint, runWhenIdle } from "./schedule.js";\n${text}`;
  }
  if (!text.includes('from "./visibility.js"')) {
    text = `import { runWhenNear } from "./visibility.js";\n${text}`;
  }

  write(target, text);
}

patchMountEngine();
patchPackageJson();
console.log("[remaining-step2-repair3] patched package.json and mount-engine.js");
