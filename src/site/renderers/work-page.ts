import type { WorkPageDefinition } from "../pages/types.ts";
import { renderPageShell } from "../shell/page-shell.ts";

export function renderWorkPage(page: WorkPageDefinition): string {
  return renderPageShell({
    page,
    title: "work — Иван Крушинский",
    description: "Selected portfolio work by Ivan Krushinsky.",
    content: `<section class="work-index" aria-labelledby="work-index-title">
  <div class="work-index__content">
    <h1 id="work-index-title">work</h1>
  </div>
</section>`,
  });
}
