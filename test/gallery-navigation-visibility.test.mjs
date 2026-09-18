import assert from "node:assert/strict";
import test from "node:test";

import { navigationLabels } from "../src/data/navigation.ts";
import {
  getBreadcrumbItems,
  getPrimaryNavigationItems,
} from "../src/site/navigation/model.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

test("Gallery is visible in primary navigation with its Russian label", () => {
  const menu = getPrimaryNavigationItems();
  assert.equal(
    menu.some(({ id }) => id === "gallery"),
    true,
    "Gallery must render in the primary menu",
  );

  const label = navigationLabels.find(({ id }) => id === "gallery");
  assert.equal(label?.label, "Галерея");

  const page = sitePages.find(({ id }) => id === "gallery");
  assert.ok(page, "missing Gallery SitePage");
  assert.equal(getBreadcrumbItems(page).at(-1)?.label, "Галерея");
});
