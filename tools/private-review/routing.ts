export type ReviewDepth = "Quick" | "Interactive" | "Full";
export type VisualImpact = "none" | "static" | "ambiguous" | "interactive" | "global";
export type ChangeStatus =
  | "added"
  | "modified"
  | "deleted"
  | "renamed"
  | "copied"
  | "type-changed";

export interface VisualReviewChange {
  path: string;
  previousPath?: string;
  status?: ChangeStatus;
  userVisibleText?: boolean;
  symlink?: boolean;
  submodule?: boolean;
}

interface DeclarationBase {
  caseIds: readonly string[];
  minimumDepth?: ReviewDepth;
}

export type VisualReviewDeclaration =
  | (DeclarationBase & { path: string; pathPrefix?: never })
  | (DeclarationBase & { pathPrefix: string; path?: never });

export interface VisualReviewRoutingOptions {
  knownCaseIds: readonly string[];
  declarations?: readonly VisualReviewDeclaration[];
  minimumDepth?: ReviewDepth;
  additionalCaseIds?: readonly string[];
  forceVisual?: boolean;
}

export interface VisualReviewRoute {
  visualImpact: VisualImpact;
  reviewDepth: ReviewDepth | null;
  affectedCaseMode: "none" | "explicit" | "all";
  affectedCaseIds: string[];
  reasons: string[];
}

interface PathDecision {
  impact: VisualImpact;
  depth: ReviewDepth | null;
  mode: "none" | "explicit" | "all";
  caseIds: string[];
  reason: string;
}

const depthRank: Record<ReviewDepth, number> = {
  Quick: 1,
  Interactive: 2,
  Full: 3,
};

const impactRank: Record<VisualImpact, number> = {
  none: 0,
  static: 1,
  ambiguous: 2,
  interactive: 3,
  global: 4,
};

const validStatuses = new Set<ChangeStatus>([
  "added",
  "modified",
  "deleted",
  "renamed",
  "copied",
  "type-changed",
]);

const clearlyNonVisualPatterns = [
  /^docs\//u,
  /^test\//u,
  /^\.agents\//u,
  /^\.github\//u,
  /^(?:README[^/]*|AGENTS\.md|LICENSE|\.editorconfig|\.gitignore|\.gitattributes)$/u,
];

const globalVisualPatterns = [
  /^src\/main\.[^/]+$/u,
  /^src\/interactive\.[^/]+$/u,
  /^src\/motion\//u,
  /^src\/styles\/(?:base|tokens|layout|reset|index|components)\.[^/]+$/u,
  /^src\/site\/(?:pages|navigation)\//u,
  /^(?:vite(?:\.lab)?\.config\.[^/]+|package(?:-lock)?\.json|tsconfig[^/]*\.json)$/u,
  /^(?:index|404)\.html$/u,
];

const sharedUiPatterns = [
  /^src\/components\//u,
  /^src\/templates\//u,
  /^src\/site\/renderers\//u,
  /^src\/styles\//u,
];

const mediaPatterns = [
  /^public\/media\//u,
  /^src\/content\/media-catalog\//u,
  /^src\/data\/media\//u,
];

const interactivePattern =
  /(?:interactive|motion|carousel|gallery|lightbox|slider|deck|infinite|canvas|webgl|three|video|navigation)/iu;

function normalizeRepositoryPath(rawPath: string): { path: string; unsafe: boolean } {
  if (typeof rawPath !== "string" || rawPath.length === 0 || rawPath.includes("\0")) {
    return { path: String(rawPath ?? ""), unsafe: true };
  }

  const slashPath = rawPath.replaceAll("\\", "/");
  const path = slashPath.startsWith("./") ? slashPath.slice(2) : slashPath;
  const segments = path.split("/");
  const unsafe =
    path.startsWith("/") ||
    /^[A-Za-z]:\//u.test(path) ||
    segments.includes("..") ||
    segments.includes("") ||
    path !== path.trim();

  return { path, unsafe };
}

function canonicalPathKey(path: string): string {
  return path.normalize("NFKC").toLocaleLowerCase("en-US");
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "en-US"));
}

function maxDepth(current: ReviewDepth | null, next: ReviewDepth | null): ReviewDepth | null {
  if (current === null) return next;
  if (next === null) return current;
  return depthRank[next] > depthRank[current] ? next : current;
}

function maxImpact(current: VisualImpact, next: VisualImpact): VisualImpact {
  return impactRank[next] > impactRank[current] ? next : current;
}

function allCasesDecision(impact: VisualImpact, depth: ReviewDepth, reason: string): PathDecision {
  return {
    impact,
    depth,
    mode: "all",
    caseIds: [],
    reason,
  };
}

function explicitDecision(
  impact: VisualImpact,
  depth: ReviewDepth,
  caseIds: readonly string[],
  reason: string,
): PathDecision {
  return {
    impact,
    depth,
    mode: "explicit",
    caseIds: sortedUnique(caseIds),
    reason,
  };
}

function noneDecision(reason: string): PathDecision {
  return {
    impact: "none",
    depth: null,
    mode: "none",
    caseIds: [],
    reason,
  };
}

function localOwnerFromPath(path: string): string | null {
  const patterns = [
    /^src\/content\/cases\/([^/]+)\.(?:json|ts)$/u,
    /^src\/content\/pages\/(?:cases|projects)\/([^/]+)\.ts$/u,
    /^src\/data\/content\/([^/]+)\.ts$/u,
    /^work\/([^/]+)\//u,
    /^public\/media\/projects\/([^/]+)\//u,
  ];

  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function normalizedDeclarationMatch(
  path: string,
  declaration: VisualReviewDeclaration,
): { matches: boolean; specificity: number; unsafe: boolean } {
  if ("path" in declaration && declaration.path !== undefined) {
    const normalized = normalizeRepositoryPath(declaration.path);
    return {
      matches: !normalized.unsafe && normalized.path === path,
      specificity: normalized.path.length + 100_000,
      unsafe: normalized.unsafe,
    };
  }

  const normalized = normalizeRepositoryPath(declaration.pathPrefix);
  const prefix = normalized.path.endsWith("/") ? normalized.path : `${normalized.path}/`;
  return {
    matches: !normalized.unsafe && path.startsWith(prefix),
    specificity: prefix.length,
    unsafe: normalized.unsafe,
  };
}

function matchingDeclaration(
  path: string,
  declarations: readonly VisualReviewDeclaration[],
): { declaration: VisualReviewDeclaration | null; malformed: boolean } {
  let declaration: VisualReviewDeclaration | null = null;
  let specificity = -1;
  let malformed = false;

  for (const candidate of declarations) {
    const match = normalizedDeclarationMatch(path, candidate);
    malformed ||= match.unsafe || candidate.caseIds.length === 0;
    if (match.matches && match.specificity > specificity) {
      declaration = candidate;
      specificity = match.specificity;
    }
  }

  return { declaration, malformed };
}

function decisionForPath(
  path: string,
  change: VisualReviewChange,
  knownCaseIds: ReadonlySet<string>,
  declarations: readonly VisualReviewDeclaration[],
): PathDecision {
  const declarationMatch = matchingDeclaration(path, declarations);
  if (declarationMatch.malformed) {
    return allCasesDecision("global", "Full", `Malformed visual-review declaration encountered while routing ${path}`);
  }

  const declaration = declarationMatch.declaration;
  if (declaration) {
    if (declaration.caseIds.some((caseId) => !knownCaseIds.has(caseId))) {
      return allCasesDecision("global", "Full", `Visual-review declaration for ${path} references an unknown Case`);
    }

    const declaredDepth =
      declaration.minimumDepth ??
      (interactivePattern.test(path) ? "Interactive" : "Quick");
    const impact: VisualImpact =
      declaredDepth === "Full"
        ? "global"
        : declaredDepth === "Interactive"
          ? "interactive"
          : "static";

    return explicitDecision(
      impact,
      declaredDepth,
      declaration.caseIds,
      `Explicit declaration maps ${path} to affected Cases`,
    );
  }

  if (globalVisualPatterns.some((pattern) => pattern.test(path))) {
    return allCasesDecision("global", "Full", `Global/shared visual surface changed: ${path}`);
  }

  const owner = localOwnerFromPath(path);
  if (owner) {
    if (!knownCaseIds.has(owner)) {
      return allCasesDecision("ambiguous", "Quick", `Local-looking path has unknown Case ownership: ${path}`);
    }

    const interactive = interactivePattern.test(path);
    return explicitDecision(
      interactive ? "interactive" : "static",
      interactive ? "Interactive" : "Quick",
      [owner],
      `Case-owned visual source changed: ${path}`,
    );
  }

  if (change.userVisibleText === true) {
    return allCasesDecision("ambiguous", "Quick", `User-visible text changed without narrower Case ownership: ${path}`);
  }

  if (sharedUiPatterns.some((pattern) => pattern.test(path))) {
    return allCasesDecision("global", "Full", `Shared UI changed without an affected-Case declaration: ${path}`);
  }

  if (mediaPatterns.some((pattern) => pattern.test(path))) {
    return allCasesDecision("ambiguous", "Quick", `Media change has no provable Case ownership: ${path}`);
  }

  if (clearlyNonVisualPatterns.some((pattern) => pattern.test(path))) {
    return noneDecision(`Clearly non-visual repository surface changed: ${path}`);
  }

  if (/^src\/(?:content|data)\//u.test(path)) {
    return allCasesDecision("ambiguous", "Quick", `Content/data change has no provable Case ownership: ${path}`);
  }

  if (/^src\//u.test(path)) {
    return allCasesDecision(
      interactivePattern.test(path) ? "interactive" : "ambiguous",
      interactivePattern.test(path) ? "Interactive" : "Quick",
      `Source change is visual-impact ambiguous: ${path}`,
    );
  }

  return allCasesDecision("ambiguous", "Quick", `Unclassified repository change is treated as visual-impact ambiguous: ${path}`);
}

function invalidCaseConfigurationReason(caseIds: readonly string[]): string | null {
  const canonical = new Map<string, string>();

  for (const caseId of caseIds) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(caseId)) {
      return `Invalid visual-review Case id: ${caseId}`;
    }

    const key = caseId.normalize("NFKC").toLocaleLowerCase("en-US");
    const previous = canonical.get(key);
    if (previous && previous !== caseId) {
      return `Case id collision between ${previous} and ${caseId}`;
    }
    canonical.set(key, caseId);
  }

  return null;
}

export function routeVisualReviewChanges(
  changes: readonly VisualReviewChange[],
  options: VisualReviewRoutingOptions,
): VisualReviewRoute {
  const knownCaseIds = sortedUnique(options.knownCaseIds);
  const knownCaseSet = new Set(knownCaseIds);
  const declarations = options.declarations ?? [];
  const reasons: string[] = [];
  const explicitCaseIds = new Set<string>();
  let visualImpact: VisualImpact = "none";
  let reviewDepth: ReviewDepth | null = null;
  let affectedCaseMode: "none" | "explicit" | "all" = "none";

  const caseConfigurationError = invalidCaseConfigurationReason(knownCaseIds);
  if (caseConfigurationError) {
    return {
      visualImpact: "global",
      reviewDepth: "Full",
      affectedCaseMode: "all",
      affectedCaseIds: knownCaseIds,
      reasons: [caseConfigurationError],
    };
  }

  const seenCanonicalPaths = new Map<string, string>();
  let unsafeChangeReason: string | null = null;

  const routePath = (rawPath: string, change: VisualReviewChange) => {
    const normalized = normalizeRepositoryPath(rawPath);
    if (normalized.unsafe) {
      unsafeChangeReason = `Unsafe path fails closed: ${rawPath}`;
      return;
    }

    const canonical = canonicalPathKey(normalized.path);
    const previous = seenCanonicalPaths.get(canonical);
    if (previous && previous !== normalized.path) {
      unsafeChangeReason = `Case/Unicode path collision fails closed: ${previous} <> ${normalized.path}`;
      return;
    }
    seenCanonicalPaths.set(canonical, normalized.path);

    const decision = decisionForPath(normalized.path, change, knownCaseSet, declarations);
    visualImpact = maxImpact(visualImpact, decision.impact);
    reviewDepth = maxDepth(reviewDepth, decision.depth);
    reasons.push(decision.reason);

    if (decision.mode === "all") {
      affectedCaseMode = "all";
      return;
    }

    if (decision.mode === "explicit" && affectedCaseMode !== "all") {
      affectedCaseMode = "explicit";
      for (const caseId of decision.caseIds) explicitCaseIds.add(caseId);
    }
  };

  for (const change of changes) {
    if (
      change.symlink === true ||
      change.submodule === true ||
      (change.status !== undefined && !validStatuses.has(change.status))
    ) {
      unsafeChangeReason = `Unsupported change metadata fails closed for path: ${change.path}`;
      break;
    }

    if (change.status === "renamed" && !change.previousPath) {
      unsafeChangeReason = `Rename without previousPath fails closed for path: ${change.path}`;
      break;
    }

    routePath(change.path, change);
    if (unsafeChangeReason) break;

    if (change.previousPath) {
      routePath(change.previousPath, change);
      if (unsafeChangeReason) break;
    }
  }

  if (unsafeChangeReason) {
    return {
      visualImpact: "global",
      reviewDepth: "Full",
      affectedCaseMode: "all",
      affectedCaseIds: knownCaseIds,
      reasons: [...reasons, unsafeChangeReason],
    };
  }

  const additionalCaseIds = options.additionalCaseIds ?? [];
  const unknownAdditional = additionalCaseIds.find((caseId) => !knownCaseSet.has(caseId));
  if (unknownAdditional) {
    return {
      visualImpact: "global",
      reviewDepth: "Full",
      affectedCaseMode: "all",
      affectedCaseIds: knownCaseIds,
      reasons: [...reasons, `Manual escalation references unknown Case: ${unknownAdditional}`],
    };
  }

  if (options.forceVisual === true || options.minimumDepth !== undefined || additionalCaseIds.length > 0) {
    if (visualImpact === "none") {
      visualImpact = "ambiguous";
      reviewDepth = "Quick";
      affectedCaseMode = additionalCaseIds.length > 0 ? "explicit" : "all";
      reasons.push("Manual/agent escalation forced visual review");
    }

    if (options.minimumDepth !== undefined) {
      reviewDepth = maxDepth(reviewDepth, options.minimumDepth);
      reasons.push(`Manual/agent minimum review depth: ${options.minimumDepth}`);
    }

    if (affectedCaseMode !== "all" && additionalCaseIds.length > 0) {
      affectedCaseMode = "explicit";
      for (const caseId of additionalCaseIds) explicitCaseIds.add(caseId);
      reasons.push("Manual/agent escalation broadened affected Cases");
    }
  }

  if (reviewDepth === null) {
    return {
      visualImpact: "none",
      reviewDepth: null,
      affectedCaseMode: "none",
      affectedCaseIds: [],
      reasons: sortedUnique(reasons),
    };
  }

  return {
    visualImpact,
    reviewDepth,
    affectedCaseMode,
    affectedCaseIds:
      affectedCaseMode === "all"
        ? knownCaseIds
        : sortedUnique([...explicitCaseIds]),
    reasons: sortedUnique(reasons),
  };
}
