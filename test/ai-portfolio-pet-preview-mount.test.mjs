import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("portfolio pet mounts lazily in dev or explicit prototype mode while production stays off by default", async () => {
  const main = read("src/main.ts");
  const component = read("src/components/portfolio-pet.ts");
  const productionWorkflow = read(".github/workflows/pages.yml");
  const styleUrl = new URL("../src/components/portfolio-pet.css", import.meta.url);
  const featureFlag = await import(new URL("../src/features/portfolio-pet/feature-flag.ts", import.meta.url));

  assert.match(main, /resolvePortfolioPetEnabled/);
  assert.match(main, /VITE_PORTFOLIO_PET_ENABLED/);
  assert.match(main, /import\.meta\.env\.DEV/);
  assert.match(main, /new URLSearchParams\(window\.location\.search\)\.get\("pet"\) === "1"/);
  assert.match(main, /import\("\.\/components\/portfolio-pet\.ts"\)/);
  assert.doesNotMatch(main, /import \{[^}]*mountPortfolioPet[^}]*\} from "\.\/components\/portfolio-pet\.ts"/s);

  assert.equal(existsSync(styleUrl), true, "missing isolated portfolio pet stylesheet");
  assert.match(component, /import "\.\/portfolio-pet\.css"/);
  assert.match(component, /observePortfolioPetCharacter/);

  assert.equal(featureFlag.resolvePortfolioPetEnabled({ isDev: true }), true);
  assert.equal(featureFlag.resolvePortfolioPetEnabled({ isDev: false, previewRequested: true }), true);
  assert.equal(featureFlag.resolvePortfolioPetEnabled({ isDev: false }), false);
  assert.doesNotMatch(productionWorkflow, /VITE_PORTFOLIO_PET_ENABLED/);
});
