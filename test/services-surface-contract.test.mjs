import assert from "node:assert/strict";
import test from "node:test";

import { PRIMARY_NAVIGATION_PAGE_IDS } from "../src/site/navigation/primary.ts";
import { getPageByPath } from "../src/site/pages/manifest.ts";
import {
  allServiceGroups,
  fastGraphicDesign,
  mainServiceGroups,
} from "../src/site/pages/services-content.ts";
import {
  renderAllServicesPage,
  renderServicesPage,
} from "../src/site/renderers/services-page.ts";

const flattenMainCards = () => mainServiceGroups.flatMap((group) => group.cards);

test("Services routes are manifest-owned Vite SitePages without changing primary navigation", () => {
  const services = getPageByPath("/services/");
  const allServices = getPageByPath("/services/all/");

  assert.ok(services, "missing /services/ SitePage");
  assert.ok(allServices, "missing /services/all/ SitePage");
  assert.equal(services.renderer, "services");
  assert.equal(allServices.renderer, "all-services");
  assert.deepEqual(services.build, { kind: "vite" });
  assert.deepEqual(allServices.build, { kind: "vite" });

  assert.equal(PRIMARY_NAVIGATION_PAGE_IDS.includes("services"), false);
  assert.equal(PRIMARY_NAVIGATION_PAGE_IDS.includes("all-services"), false);
});

test("main Services surface contains exactly the approved 15 cards in five disciplines", () => {
  assert.deepEqual(
    mainServiceGroups.map((group) => group.id),
    ["design", "3d", "ai", "code", "music"],
  );
  assert.equal(flattenMainCards().length, 15);
  assert.equal(new Set(flattenMainCards().map((card) => card.id)).size, 15);
});

test("Fast Graphic Design stays separate from the main-card count", () => {
  assert.equal(fastGraphicDesign.id, "fast-graphic-design");
  assert.ok(fastGraphicDesign.items.length >= 6);
  assert.equal(flattenMainCards().some((card) => card.id === fastGraphicDesign.id), false);
});

test("All Services keeps the same five public disciplines", () => {
  assert.deepEqual(
    allServiceGroups.map((group) => group.id),
    ["design", "3d", "ai", "code", "music"],
  );
  assert.ok(allServiceGroups.every((group) => group.sections.length > 0));
});

test("rendered Services surfaces keep current contact fallback and never publish prices", () => {
  const servicesPage = getPageByPath("/services/");
  const allServicesPage = getPageByPath("/services/all/");
  assert.ok(servicesPage && servicesPage.renderer === "services");
  assert.ok(allServicesPage && allServicesPage.renderer === "all-services");

  const mainHtml = renderServicesPage(servicesPage);
  const allHtml = renderAllServicesPage(allServicesPage);
  const combined = `${mainHtml}\n${allHtml}`;

  assert.equal((mainHtml.match(/data-service-card=/g) ?? []).length, 15);
  assert.match(mainHtml, />Обсудить проект</);
  assert.match(mainHtml, />Есть небольшая задача</);
  assert.match(combined, /mailto:i@lookawful\.ru/);
  assert.doesNotMatch(
    combined,
    /(?:₽|\$|€|руб(?:\.|лей)?|(?<![\p{L}])цена(?![\p{L}])|стоимость\s+от|price\s+from)/iu,
  );
});
