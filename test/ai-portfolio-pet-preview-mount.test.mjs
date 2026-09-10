import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("portfolio pet mounts lazily in dev/preview while production stays opt-in", () => {
  const main = read("src/main.ts");
  const component = read("src/components/portfolio-pet.ts");
  const previewWorkflow = read(".github/workflows/pr-preview.yml");
  const productionWorkflow = read(".github/workflows/pages.yml");
  const styleUrl = new URL("../src/components/portfolio-pet.css", import.meta.url);

  assert.match(main, /resolvePortfolioPetEnabled/);
  assert.match(main, /VITE_PORTFOLIO_PET_ENABLED/);
  assert.match(main, /import\.meta\.env\.DEV/);
  assert.match(main, /import\("\.\/components\/portfolio-pet\.ts"\)/);
  assert.doesNotMatch(main, /import \{[^}]*mountPortfolioPet[^}]*\} from "\.\/components\/portfolio-pet\.ts"/s);

  assert.equal(existsSync(styleUrl), true, "missing isolated portfolio pet stylesheet");
  assert.match(component, /import "\.\/portfolio-pet\.css"/);

  assert.match(previewWorkflow, /VITE_PORTFOLIO_PET_ENABLED:\s*["']1["']/);
  assert.doesNotMatch(productionWorkflow, /VITE_PORTFOLIO_PET_ENABLED/);
});
