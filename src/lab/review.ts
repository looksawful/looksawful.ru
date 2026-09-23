import "./lab.css";

type ReviewDepth = "quick" | "interactive" | "full";

type ReviewEvidence = {
  id: string;
  kind: string;
  contentType: string;
  url: string;
};

type ReviewManifest = {
  version: 1;
  reviewId: string;
  reviewTargetId: string;
  sourceSha: string;
  reviewDepth: ReviewDepth;
  capturedAt: string;
  evidence: ReviewEvidence[];
};

const REVIEW_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const REVIEW_TARGET_ID = /^[a-z][a-z0-9-]*(?::[a-z0-9][a-z0-9-]{0,95})?$/u;
const SOURCE_SHA = /^[0-9a-f]{40}$/u;
const EVIDENCE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u;
const EVIDENCE_KINDS = new Set(["viewport", "full-page", "component", "diff"]);
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const PLACEHOLDER = "—";

function setText(id: string, value: string): void {
  const node = document.getElementById(id);
  if (node !== null) node.textContent = value;
}

function setStatus(message: string, state: "loading" | "ready" | "empty" | "error"): void {
  const node = document.getElementById("review-status");
  if (node === null) return;
  node.textContent = message;
  node.dataset.state = state;
}

function setBusy(busy: boolean): void {
  const evidence = document.getElementById("review-evidence");
  if (evidence !== null) evidence.setAttribute("aria-busy", String(busy));

  const reload = document.getElementById("review-reload");
  if (reload instanceof HTMLButtonElement) reload.disabled = busy;
}

function setReloadVisible(visible: boolean): void {
  const reload = document.getElementById("review-reload");
  if (reload instanceof HTMLButtonElement) reload.hidden = !visible;
}

function clearReview(): void {
  setText("review-target", PLACEHOLDER);
  setText("review-sha", PLACEHOLDER);
  setText("review-depth", PLACEHOLDER);
  document.getElementById("review-evidence")?.replaceChildren();
}

function failReview(message: string): void {
  clearReview();
  setBusy(false);
  setReloadVisible(true);
  setStatus(message, "error");
}

function isEvidence(value: unknown): value is ReviewEvidence {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    EVIDENCE_ID.test(candidate.id) &&
    typeof candidate.kind === "string" &&
    EVIDENCE_KINDS.has(candidate.kind) &&
    typeof candidate.contentType === "string" &&
    IMAGE_TYPES.has(candidate.contentType) &&
    typeof candidate.url === "string" &&
    candidate.url === `/lab/review/evidence/${candidate.id}`
  );
}

function isManifest(value: unknown): value is ReviewManifest {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    typeof candidate.reviewId === "string" &&
    REVIEW_ID.test(candidate.reviewId) &&
    typeof candidate.reviewTargetId === "string" &&
    REVIEW_TARGET_ID.test(candidate.reviewTargetId) &&
    typeof candidate.sourceSha === "string" &&
    SOURCE_SHA.test(candidate.sourceSha) &&
    (candidate.reviewDepth === "quick" ||
      candidate.reviewDepth === "interactive" ||
      candidate.reviewDepth === "full") &&
    typeof candidate.capturedAt === "string" &&
    Number.isFinite(Date.parse(candidate.capturedAt)) &&
    Array.isArray(candidate.evidence) &&
    candidate.evidence.length > 0 &&
    candidate.evidence.every(isEvidence)
  );
}

function renderEvidence(manifest: ReviewManifest): void {
  const root = document.getElementById("review-evidence");
  if (root === null) return;
  root.replaceChildren();

  for (const item of manifest.evidence) {
    const figure = document.createElement("figure");
    figure.className = "review-evidence__item";
    figure.setAttribute("aria-busy", "true");

    const image = document.createElement("img");
    image.alt = `${manifest.reviewTargetId} ${item.kind} review evidence ${item.id}`;
    image.loading = "eager";
    image.decoding = "async";

    const caption = document.createElement("figcaption");
    caption.textContent = `${item.kind} · ${item.id}`;

    image.addEventListener(
      "load",
      () => figure.setAttribute("aria-busy", "false"),
      { once: true },
    );
    image.addEventListener(
      "error",
      () => {
        figure.setAttribute("aria-busy", "false");
        image.remove();
        const error = document.createElement("p");
        error.className = "review-evidence__error";
        error.setAttribute("role", "status");
        error.textContent = "Evidence image unavailable.";
        figure.insertBefore(error, caption);
      },
      { once: true },
    );

    figure.append(image, caption);
    root.append(figure);
    image.src = item.url;
  }
}

async function loadReview(): Promise<void> {
  clearReview();
  setReloadVisible(false);
  setBusy(true);
  setStatus("Loading private review evidence.", "loading");

  let response: Response;
  try {
    response = await fetch("/lab/review/api", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    failReview("Private review evidence could not be loaded.");
    return;
  }

  if (response.status === 404) {
    clearReview();
    setBusy(false);
    setReloadVisible(true);
    setStatus("No current private review.", "empty");
    return;
  }
  if (!response.ok) {
    failReview(`Private review evidence is unavailable (HTTP ${response.status}).`);
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    failReview("Private review manifest could not be read.");
    return;
  }

  if (!isManifest(payload)) {
    failReview("Private review manifest is invalid.");
    return;
  }

  setStatus(
    `Captured ${new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(payload.capturedAt))}.`,
    "ready",
  );
  setText("review-target", payload.reviewTargetId);
  setText("review-sha", payload.sourceSha);
  setText("review-depth", payload.reviewDepth);
  renderEvidence(payload);
  setBusy(false);
}

const reload = document.getElementById("review-reload");
if (reload instanceof HTMLButtonElement) {
  reload.addEventListener("click", () => window.location.reload());
}

void loadReview();
