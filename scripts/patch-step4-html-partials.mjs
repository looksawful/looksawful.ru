import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const file = (name) => path.join(root, name);
const exists = (name) => fs.existsSync(file(name));
const read = (name) => exists(name) ? fs.readFileSync(file(name), "utf8") : "";
const write = (name, text) => {
  const target = file(name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text, "utf8");
};
const bytes = (text) => Buffer.byteLength(text || "");
const count = (text, re) => (text.match(re) || []).length;

const html = read("index.html");
if (!html) throw new Error("index.html is missing or empty");

function findMatchingElement(text, start) {
  const open = text.slice(start).match(/^<([a-zA-Z0-9-]+)\b[^>]*>/);
  if (!open) return null;
  const tag = open[1].toLowerCase();
  const tokenRe = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  tokenRe.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tokenRe.exec(text))) {
    const token = match[0];
    const selfClosing = /\/>$/.test(token);
    const closing = /^<\//.test(token);
    if (!closing && !selfClosing) depth += 1;
    if (closing) depth -= 1;
    if (depth === 0) {
      return text.slice(start, tokenRe.lastIndex);
    }
  }
  return null;
}

function extractElementById(text, id) {
  const idRe = new RegExp(`<([a-zA-Z0-9-]+)\\b[^>]*\\bid=["']${id}["'][^>]*>`, "i");
  const match = idRe.exec(text);
  if (!match) return "";
  return findMatchingElement(text, match.index) || "";
}

function extractElementContaining(text, needle, tags = ["section", "article", "div", "aside", "header", "main"]) {
  const needleIndex = text.indexOf(needle);
  if (needleIndex < 0) return "";
  const candidates = [];
  for (const tag of tags) {
    const openRe = new RegExp(`<${tag}\\b[^>]*>`, "gi");
    let match;
    while ((match = openRe.exec(text))) {
      if (match.index > needleIndex) break;
      const fragment = findMatchingElement(text, match.index);
      if (fragment && match.index <= needleIndex && match.index + fragment.length >= needleIndex) {
        candidates.push({ tag, start: match.index, fragment });
      }
    }
  }
  candidates.sort((a, b) => b.start - a.start);
  return candidates[0]?.fragment || "";
}

function extractArticleByDataPet(text, key) {
  const petIndex = text.indexOf(`data-pet-preview="${key}"`);
  if (petIndex < 0) return "";
  const before = text.lastIndexOf("<article", petIndex);
  if (before < 0) return "";
  return findMatchingElement(text, before) || "";
}

const policyBook = extractElementContaining(html, "data-policy-book", ["article", "section", "div"]);
const petsSection = extractElementById(html, "pets");
const petKeys = [...html.matchAll(/data-pet-preview=["']([^"']+)["']/g)].map((m) => m[1]);
const uniquePetKeys = [...new Set(petKeys)];

write("src/html/pages/index.snapshot.html", html);
write("src/html/partials/policy/policy-book.html", policyBook || "<!-- policy book extraction failed: data-policy-book not found -->\n");
write("src/html/partials/pets/pets-preview-section.html", petsSection || "<!-- pets extraction failed: section#pets not found -->\n");

for (const key of uniquePetKeys) {
  const safeKey = key.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "pet";
  const fragment = extractArticleByDataPet(html, key);
  write(`src/html/partials/pets/${safeKey}.html`, fragment || `<!-- pet preview extraction failed: ${key} -->\n`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  source: "index.html",
  mode: "safe snapshot plus extracted partials; live index.html is not rewritten in this step",
  files: {
    indexSnapshot: { path: "src/html/pages/index.snapshot.html", bytes: bytes(html) },
    policyBook: { path: "src/html/partials/policy/policy-book.html", bytes: bytes(policyBook), extracted: Boolean(policyBook) },
    petsSection: { path: "src/html/partials/pets/pets-preview-section.html", bytes: bytes(petsSection), extracted: Boolean(petsSection) },
    petPreviews: uniquePetKeys.map((key) => ({
      key,
      path: `src/html/partials/pets/${key.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "pet"}.html`,
      extracted: Boolean(extractArticleByDataPet(html, key)),
    })),
  },
  counts: {
    policyBookRefs: count(html, /data-policy-book/g),
    petsSectionRefs: count(html, /id=["']pets["']/g),
    petPreviewRefs: uniquePetKeys.length,
    mediaLayoutAttrs: count(html, /data-media-layout=/g),
    mediaRatioAttrs: count(html, /data-media-ratio=/g),
  },
};
write("src/html/partials.manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);

const indexReadme = `# src/html partial baseline\n\nThis folder is a source-level baseline for the remaining refactor.\n\nThe current live page is still \`index.html\`. Step 4 intentionally does not rewrite the production root file. It creates a snapshot and extracts stable partials that can be compared before the later destructive cleanup pass.\n\n## files\n\n- \`pages/index.snapshot.html\` — exact snapshot of the live root page at extraction time.\n- \`partials/policy/policy-book.html\` — extracted policy book organism.\n- \`partials/pets/pets-preview-section.html\` — extracted pets section.\n- \`partials/pets/*.html\` — extracted pet preview articles.\n- \`partials.manifest.json\` — extraction manifest and counts.\n\n## rule\n\nDo not make \`scripts/build-html.mjs --write\` overwrite \`index.html\` until parity checks and visual QA are complete.\n`;
write("src/html/README.md", indexReadme);

const doc = `# remaining refactor step 4 — html partial baseline\n\n## goal\n\nCreate a source-level HTML partial baseline without changing the live page. This closes the missing master-plan item: HTML partial pipeline, policy book partial extraction and pet preview source partials.\n\n## what changed\n\n- Added \`scripts/build-html.mjs\` as a parity/check script.\n- Added \`src/html/pages/index.snapshot.html\`.\n- Added \`src/html/partials/policy/policy-book.html\`.\n- Added \`src/html/partials/pets/pets-preview-section.html\`.\n- Added per-pet preview partial files.\n- Added \`src/html/partials.manifest.json\`.\n\n## safety model\n\nThe live \`index.html\` is not rewritten in this step. The build pipeline checks extracted source fragments and creates a parity report. A later cleanup pass may switch the root page to generated output only after the snapshot, policy book and pet preview fragments are proven equivalent.\n\n## next step\n\nStep 5 may delete aliases, archive legacy folders and add browser QA, but only after this source baseline is committed.\n`;
write("docs/refactor/html-partials.md", doc);

const packageJson = JSON.parse(read("package.json") || "{}");
packageJson.scripts ||= {};
if (packageJson.scripts["audit:refactor"] && packageJson.scripts["audit:refactor"] !== "node scripts/audit-refactor-step4-html-partials.mjs") {
  packageJson.scripts["audit:refactor:step3"] = packageJson.scripts["audit:refactor"];
}
packageJson.scripts["audit:refactor"] = "node scripts/audit-refactor-step4-html-partials.mjs";
packageJson.scripts["build:html"] = "node scripts/build-html.mjs --check";
write("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);

console.log("[remaining-step4] extracted html partial baseline");
console.log(`[remaining-step4] policy book extracted: ${Boolean(policyBook)}`);
console.log(`[remaining-step4] pets section extracted: ${Boolean(petsSection)}`);
console.log(`[remaining-step4] pet preview partials: ${uniquePetKeys.length}`);
