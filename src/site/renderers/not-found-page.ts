import type { NotFoundPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";

export function renderNotFoundPage(page: NotFoundPageDefinition): string {
  return renderPageShell({
    page,
    title: "404 — Иван Крушинский",
    description: "Страница не найдена.",
    content: '<section class="wrapper stack"><h1>404</h1><p><a href="/">На главную</a></p></section>',
  });
}
