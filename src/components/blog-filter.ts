import { BLOG_KINDS, type BlogKind } from "../site/blog/types.ts";

export type BlogKindFilter = BlogKind | "all";
export interface BlogFilterState { readonly kind: BlogKindFilter; readonly query: string; }
export interface BlogFilterCandidate { readonly kind: BlogKind; readonly searchText: string; }
const blogKinds = new Set<string>(BLOG_KINDS);

export function normalizeBlogSearch(value: string): string { return value.normalize("NFKC").trim().toLocaleLowerCase("ru-RU"); }
export function parseBlogFilterState(search: string): BlogFilterState {
  const params = new URLSearchParams(search);
  const requestedKind = params.get("type") ?? "all";
  const kind: BlogKindFilter = requestedKind === "all" || blogKinds.has(requestedKind) ? requestedKind as BlogKindFilter : "all";
  const query = (params.get("q") ?? "").normalize("NFKC").trim();
  return Object.freeze({ kind, query });
}
export function serializeBlogFilterState(state: BlogFilterState): string {
  const params = new URLSearchParams();
  if (state.kind !== "all") params.set("type", state.kind);
  if (state.query.trim()) params.set("q", state.query.trim());
  return params.toString();
}
export function matchesBlogFilter(candidate: BlogFilterCandidate, state: BlogFilterState): boolean {
  if (state.kind !== "all" && candidate.kind !== state.kind) return false;
  const query = normalizeBlogSearch(state.query);
  return !query || normalizeBlogSearch(candidate.searchText).includes(query);
}

export function initBlogFilter(root: ParentNode = document, target: Window = window): () => void {
  const index = root.querySelector("[data-blog-index]");
  if (!(index instanceof HTMLElement)) return () => {};
  const input = index.querySelector("[data-blog-search-input]");
  const empty = index.querySelector("[data-blog-empty]");
  const count = index.querySelector("[data-blog-count]");
  const buttons = [...index.querySelectorAll("[data-blog-filter-kind]")].filter((node): node is HTMLButtonElement => node instanceof HTMLButtonElement);
  const cards = [...index.querySelectorAll("[data-blog-card]")].filter((node): node is HTMLElement => node instanceof HTMLElement);
  if (!(input instanceof HTMLInputElement)) return () => {};

  let state = parseBlogFilterState(target.location.search);

  const render = (): void => {
    input.value = state.query;
    let visible = 0;
    for (const card of cards) {
      const kind = card.dataset.blogKind;
      const candidate = { kind: blogKinds.has(kind ?? "") ? kind as BlogKind : "note", searchText: card.dataset.blogSearch ?? "" };
      const matches = matchesBlogFilter(candidate, state);
      card.closest("li")?.toggleAttribute("hidden", !matches);
      if (matches) visible += 1;
    }
    buttons.forEach((button) => button.setAttribute("aria-pressed", String((button.dataset.blogFilterKind ?? "all") === state.kind)));
    if (empty instanceof HTMLElement) empty.hidden = visible !== 0 || cards.length === 0;
    if (count instanceof HTMLElement) count.textContent = String(visible);
  };

  const syncUrl = (mode: "push" | "replace"): void => {
    const query = serializeBlogFilterState(state);
    const url = `${target.location.pathname}${query ? `?${query}` : ""}${target.location.hash}`;
    target.history[mode === "push" ? "pushState" : "replaceState"](null, "", url);
  };

  const onClick = (event: Event): void => {
    const node = event.target;
    if (!(node instanceof Element)) return;
    const button = node.closest("[data-blog-filter-kind]");
    if (!(button instanceof HTMLButtonElement)) return;
    const requested = button.dataset.blogFilterKind ?? "all";
    const kind: BlogKindFilter = requested === "all" || blogKinds.has(requested) ? requested as BlogKindFilter : "all";
    state = { ...state, kind };
    syncUrl("push");
    render();
  };
  const onInput = (): void => { state = { ...state, query: input.value }; syncUrl("replace"); render(); };
  const onPopState = (): void => { state = parseBlogFilterState(target.location.search); render(); };

  index.addEventListener("click", onClick);
  input.addEventListener("input", onInput);
  target.addEventListener("popstate", onPopState);
  render();
  return () => { index.removeEventListener("click", onClick); input.removeEventListener("input", onInput); target.removeEventListener("popstate", onPopState); };
}
