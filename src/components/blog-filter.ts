import { BLOG_KINDS, type BlogKind } from "../site/blog/types.ts";

export type BlogKindFilter = BlogKind | "all";

export interface BlogFilterState {
  readonly kind: BlogKindFilter;
  readonly query: string;
}

export interface BlogFilterCandidate {
  readonly kind: BlogKind;
  readonly searchText: string;
}

const blogKinds = new Set<string>(BLOG_KINDS);

export function normalizeBlogSearch(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("ru-RU");
}

export function parseBlogFilterState(search: string): BlogFilterState {
  const params = new URLSearchParams(search);
  const requestedKind = params.get("type") ?? "all";
  const kind: BlogKindFilter = requestedKind === "all" || blogKinds.has(requestedKind)
    ? requestedKind as BlogKindFilter
    : "all";
  const query = (params.get("q") ?? "").normalize("NFKC").trim();

  return Object.freeze({ kind, query });
}

export function serializeBlogFilterState(state: BlogFilterState): string {
  const params = new URLSearchParams();

  if (state.kind !== "all") params.set("type", state.kind);
  if (state.query.trim()) params.set("q", state.query.trim());

  return params.toString();
}

export function matchesBlogFilter(
  candidate: BlogFilterCandidate,
  state: BlogFilterState,
): boolean {
  if (state.kind !== "all" && candidate.kind !== state.kind) return false;

  const query = normalizeBlogSearch(state.query);
  if (!query) return true;

  return normalizeBlogSearch(candidate.searchText).includes(query);
}
