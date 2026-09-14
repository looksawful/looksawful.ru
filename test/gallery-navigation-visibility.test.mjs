import assert from "node:assert/strict";
import test from "node:test";

import { navigationLabels } from "../src/data/navigation.ts";
import {
  getBreadcrumbItems,
  getPrimaryNavigationItems,
} from "../src/site/navigation/model.ts";
import { sitePages } from "../src/site/pages/manifest.ts";

test("Gallery stays hidden from primary navigation while retaining its Russian label", () => {
  const menu = getPrimaryNavigationItems();
  assert.equal(
    menu.some(({ id }) => id === "gallery"),
    false,
    "Gallery must not render in the primary menu yet",
  );

  const label = navigationLabels.find(({ id }) => id === "gallery");
  assert.equal(label?.label, "галерея");

  const page = sitePages.find(({ id }) => id === "gallery");
  assert.ok(page, "missing Gallery SitePage");
  assert.equal(getBreadcrumbItems(page).at(-1)?.label, "галерея");
});
