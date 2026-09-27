import assert from "node:assert/strict";
import test from "node:test";

import { createPortfolioWebMcpTools } from "../src/site/webmcp.ts";

const pages = [
  { id: "home", label: "Home", href: "/" },
  { id: "gallery", label: "Gallery", href: "/gallery/" },
];

test("WebMCP portfolio tools list canonical pages and only navigate to allowed paths", async () => {
  const navigated = [];
  const tools = createPortfolioWebMcpTools({
    pages,
    currentPath: () => "/",
    navigate: (href) => navigated.push(href),
  });

  const list = tools.find((tool) => tool.name === "list_portfolio_pages");
  const open = tools.find((tool) => tool.name === "open_portfolio_page");
  assert.ok(list);
  assert.ok(open);

  assert.deepEqual(await list.execute({}), {
    currentPath: "/",
    pages,
  });

  assert.deepEqual(await open.execute({ href: "/gallery/" }), {
    opened: true,
    page: pages[1],
  });
  assert.deepEqual(navigated, ["/gallery/"]);

  await assert.rejects(
    async () => open.execute({ href: "https://example.com/" }),
    /Unknown portfolio page/,
  );
});
