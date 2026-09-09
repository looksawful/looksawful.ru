import assert from "node:assert/strict";

import { withE2ERuntime } from "./e2e/runtime.mjs";

const ORPHAN_NAME = "runner-demo-pulse";

await withE2ERuntime(async ({ browser, baseUrl }) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseUrl}/work/awful-cases/`, { waitUntil: "networkidle" });
  await page.locator(".awful-cases-game").waitFor({ state: "visible" });

  const consumers = await page.locator(".awful-cases-game").evaluate((root, orphanName) => {
    const nodes = [root, ...root.querySelectorAll("*")];
    const matches = [];

    for (const element of nodes) {
      for (const pseudo of [null, "::before", "::after"]) {
        const style = getComputedStyle(element, pseudo);
        const names = style.animationName.split(",").map((name) => name.trim());
        if (!names.includes(orphanName)) continue;

        matches.push({
          element: element.tagName.toLowerCase(),
          className: element.className || "",
          pseudo: pseudo ?? "element",
          animationName: style.animationName,
        });
      }
    }

    return matches;
  }, ORPHAN_NAME);

  assert.deepEqual(
    consumers,
    [],
    `${ORPHAN_NAME} must have zero computed consumers on /work/awful-cases/`,
  );

  console.log(JSON.stringify({ route: "/work/awful-cases/", animationName: ORPHAN_NAME, consumers }));
});
