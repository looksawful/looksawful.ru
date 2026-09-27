import { getPrimaryNavigationItems } from "./navigation/model.ts";

export interface PortfolioWebMcpPage {
  id: string;
  label: string;
  href: string;
}

type WebMcpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: {
    readOnlyHint: boolean;
    untrustedContentHint: boolean;
  };
  execute(input: unknown): unknown | Promise<unknown>;
};

type WebMcpModelContext = {
  registerTool(
    tool: WebMcpTool,
    options?: { signal?: AbortSignal },
  ): void | Promise<void>;
};

type WebMcpDocument = Document & {
  readonly modelContext?: WebMcpModelContext;
};

interface CreatePortfolioWebMcpToolsOptions {
  pages: readonly PortfolioWebMcpPage[];
  currentPath(): string;
  navigate(href: string): void;
}

function readHref(input: unknown): string {
  if (!input || typeof input !== "object") {
    throw new TypeError("WebMCP input must be an object");
  }

  const href = (input as { href?: unknown }).href;
  if (typeof href !== "string" || !href) {
    throw new TypeError("WebMCP href must be a non-empty string");
  }

  return href;
}

export function createPortfolioWebMcpTools(
  options: CreatePortfolioWebMcpToolsOptions,
): readonly WebMcpTool[] {
  const pages = options.pages.map(({ id, label, href }) => ({ id, label, href }));
  const pagesByHref = new Map(pages.map((page) => [page.href, page]));

  return [
    {
      name: "list_portfolio_pages",
      title: "List portfolio pages",
      description:
        "List the canonical primary pages of this portfolio and the current page path.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
      },
      execute() {
        return {
          currentPath: options.currentPath(),
          pages,
        };
      },
    },
    {
      name: "open_portfolio_page",
      title: "Open portfolio page",
      description:
        "Navigate to one canonical portfolio page returned by list_portfolio_pages.",
      inputSchema: {
        type: "object",
        properties: {
          href: { type: "string" },
        },
        required: ["href"],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
      },
      execute(input) {
        const href = readHref(input);
        const page = pagesByHref.get(href);
        if (!page) throw new Error(`Unknown portfolio page: ${href}`);

        options.navigate(page.href);
        return { opened: true, page };
      },
    },
  ];
}

export function mountPortfolioWebMcp(
  root: Document = document,
  target: Window = window,
): () => void {
  const modelContext = (root as WebMcpDocument).modelContext;
  if (!modelContext?.registerTool) return () => {};

  const controller = new AbortController();
  const pages = getPrimaryNavigationItems().map(({ id, label, href }) => ({
    id,
    label,
    href,
  }));

  const tools = createPortfolioWebMcpTools({
    pages,
    currentPath: () => target.location.pathname,
    navigate: (href) => target.location.assign(href),
  });

  for (const tool of tools) {
    try {
      void Promise.resolve(
        modelContext.registerTool(tool, { signal: controller.signal }),
      ).catch((error: unknown) => {
        console.error("WebMCP tool registration failed.", error);
      });
    } catch (error) {
      console.error("WebMCP tool registration failed.", error);
    }
  }

  return () => controller.abort();
}
