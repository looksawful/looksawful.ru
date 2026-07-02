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
const count = (text, re) => (text.match(re) || []).length;
const bytes = (text) => Buffer.byteLength(text || "");

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check") || !args.has("--write");

const indexHtml = read("index.html");
const snapshot = read("src/html/pages/index.snapshot.html");
const manifestText = read("src/html/partials.manifest.json");
const policy = read("src/html/partials/policy/policy-book.html");
const pets = read("src/html/partials/pets/pets-preview-section.html");
const petFiles = exists("src/html/partials/pets")
  ? fs.readdirSync(file("src/html/partials/pets")).filter((name) => name.endsWith(".html") && name !== "pets-preview-section.html")
  : [];

let manifest = {};
try {
  manifest = JSON.parse(manifestText || "{}");
} catch {
  manifest = {};
}

const checks = [
  ["live index exists", indexHtml.length > 1000],
  ["snapshot exists", snapshot.length > 1000],
  ["snapshot matches live index", snapshot === indexHtml],
  ["manifest exists", manifestText.length > 100],
  ["policy partial exists", policy.includes("data-policy-book") || policy.includes("policy-book")],
  ["pets section partial exists", /id=[\"']pets[\"']/.test(pets) || pets.includes("data-pets-preview-list")],
  ["pet preview partial files exist", petFiles.length >= 3],
  ["pet preview partials contain data-pet-preview", petFiles.every((name) => read(`src/html/partials/pets/${name}`).includes("data-pet-preview"))],
  ["live page still has no pet iframes", count(indexHtml, /<iframe[\s\S]*?src=[\"']\/pets\//g) === 0],
  ["live page media layout attrs preserved", count(indexHtml, /data-media-layout=/g) >= 16],
  ["live page media ratio attrs preserved", count(indexHtml, /data-media-ratio=/g) >= 16],
];

let failed = false;
let out = "# html partial pipeline check\n\n";
out += `mode: ${checkOnly ? "check" : "write"}\n\n`;
out += "## checks\n";
for (const [name, ok] of checks) {
  out += `- ${ok ? "ok" : "fail"}: ${name}\n`;
  if (!ok) failed = true;
}
out += "\n## metrics\n";
out += `- indexHtmlBytes: ${bytes(indexHtml)}\n`;
out += `- snapshotBytes: ${bytes(snapshot)}\n`;
out += `- policyPartialBytes: ${bytes(policy)}\n`;
out += `- petsSectionBytes: ${bytes(pets)}\n`;
out += `- petPartialFiles: ${petFiles.length}\n`;
out += `- manifestPetPreviewRefs: ${manifest?.counts?.petPreviewRefs ?? "unknown"}\n`;
out += `- mediaLayoutAttrs: ${count(indexHtml, /data-media-layout=/g)}\n`;
out += `- mediaRatioAttrs: ${count(indexHtml, /data-media-ratio=/g)}\n`;

out += "\n## safety\n";
out += "- live index.html is not generated or overwritten by default.\n";
out += "- --write is intentionally reserved for a later parity-approved pass.\n";

write("_awful-html-partials-check.md", out);
console.log(out);

if (!checkOnly && args.has("--write")) {
  throw new Error("--write is disabled in step 4 until visual parity has been approved");
}

if (failed) process.exit(1);
