import { getPageByPath } from "../../pages/manifest.ts";
import { renderSiteNavigation } from "../../shell/navigation.ts";
import { renderHomepage } from "./home-slots.ts";

const legacyHomepageNavigation = /<nav\b(?=[^>]*\bdata-site-navigation\b)(?=[^>]*\bhidden\b)[^>]*>[\s\S]*?<\/nav>/g;

function getHomePage() {
  const page = getPageByPath("/");

  if (!page || page.type !== "home") {
    throw new Error("Homepage route is unavailable");
  }

  return page;
}

export function renderHomepagePage(html: string): string {
  const rendered = renderHomepage(html);
  const matches = rendered.match(legacyHomepageNavigation);

  if (matches?.length !== 1) {
    throw new Error(
      `Expected exactly one legacy homepage navigation, found ${matches?.length ?? 0}`,
    );
  }

  return rendered.replace(
    legacyHomepageNavigation,
    renderSiteNavigation(getHomePage()),
  );
}
