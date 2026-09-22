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
  caseId: string;
  sourceSha: string;
  reviewDepth: ReviewDepth;
  capturedAt: string;
  evidence: ReviewEvidence[];
};

type ApprovalRecord = {
  version: 1;
  reviewId: string;
  caseId: string;
  sourceSha: string;
  reviewDepth: ReviewDepth;
  approvedAt: string;
  approvedBy: string;
};

const REVIEW_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const CASE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u;
const SOURCE_SHA = /^[0-9a-f]{40}$/u;
const EVIDENCE_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/u;
const EVIDENCE_KINDS = new Set(["viewport", "full-page", "component", "diff"]);
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const PLACEHOLDER = "—";

let currentReview: ReviewManifest | null = null;

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

function setApprovalStatus(message: string, state: "idle" | "loading" | "ready" | "error"): void {
  const node = document.getElementById("review-approval-status");
  if (node === null) return;
  node.textContent = message;
  node.dataset.state = state;
}

function approvalButton(): HTMLButtonElement | null {
  const node = document.getElementById("review-approve");
  return node instanceof HTMLButtonElement ? node : null;
}

function setApprovalAvailable(available: boolean): void {
  const button = approvalButton();
  if (button === null) return;
  button.hidden = !available;
  button.disabled = !available;
  button.textContent = "Approve exact review";
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
  currentReview = null;
  setText("review-case", PLACEHOLDER);
  setText("review-sha", PLACEHOLDER);
  setText("review-depth", PLACEHOLDER);
  document.getElementById("review-evidence")?.replaceChildren();
  setApprovalAvailable(false);
  setApprovalStatus("Load a review before approval.", "idle");
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
    typeof candidate.caseId === "string" &&
    CASE_ID.test(candidate.caseId) &&
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

function isApprovalRecord(value: unknown): value is ApprovalRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    typeof candidate.reviewId === "string" &&
    REVIEW_ID.test(candidate.reviewId) &&
    typeof candidate.caseId === "string" &&
    CASE_ID.test(candidate.caseId) &&
    typeof candidate.sourceSha === "string" &&
    SOURCE_SHA.test(candidate.sourceSha) &&
    (candidate.reviewDepth === "quick" ||
      candidate.reviewDepth === "interactive" ||
      candidate.reviewDepth === "full") &&
    typeof candidate.approvedAt === "string" &&
    Number.isFinite(Date.parse(candidate.approvedAt)) &&
    typeof candidate.approvedBy === "string" &&
    candidate.approvedBy.length > 0
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
    image.alt = `${manifest.caseId} ${item.kind} review evidence ${item.id}`;
    image.loading = "eager";
    image.decoding = "async";

    const caption = document.createElement("figcaption");
    caption.textContent = `${item.kind} · ${item.id}`;

    image.addEventListener(
      "load",
      () => {
        figure.setAttribute("aria-busy", "false");
      },
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

function sameApproval(record: ApprovalRecord, manifest: ReviewManifest): boolean {
  return (
    record.reviewId === manifest.reviewId &&
    record.caseId === manifest.caseId &&
    record.sourceSha === manifest.sourceSha &&
    record.reviewDepth === manifest.reviewDepth
  );
}

function approvalTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadBaselineStatus(manifest: ReviewManifest): Promise<void> {
  let response: Response;
  try {
    response = await fetch(
      `/lab/review/baseline?caseId=${encodeURIComponent(manifest.caseId)}`,
      {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );
  } catch {
    setApprovalStatus("Baseline status could not be loaded. Approval remains available.", "error");
    return;
  }

  if (response.status === 404) {
    setApprovalStatus("No approved baseline for this Case.", "idle");
    return;
  }
  if (!response.ok) {
    setApprovalStatus(`Baseline status unavailable (HTTP ${response.status}).`, "error");
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    setApprovalStatus("Baseline status response is invalid.", "error");
    return;
  }
  if (!isApprovalRecord(payload)) {
    setApprovalStatus("Baseline status response is invalid.", "error");
    return;
  }

  if (sameApproval(payload, manifest)) {
    const button = approvalButton();
    if (button !== null) {
      button.disabled = true;
      button.textContent = "Approved";
    }
    setApprovalStatus(
      `Approved ${approvalTimestamp(payload.approvedAt)} for this exact Review.`,
      "ready",
    );
    return;
  }

  setApprovalStatus(
    `Approved baseline is ${payload.sourceSha} (${payload.reviewDepth}); current review is not approved.`,
    "idle",
  );
}

async function approveCurrentReview(): Promise<void> {
  const manifest = currentReview;
  const button = approvalButton();
  if (manifest === null || button === null || button.disabled) return;

  button.disabled = true;
  setApprovalStatus("Approving the exact immutable Review shown above.", "loading");

  let response: Response;
  try {
    response = await fetch("/lab/review/approval", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        reviewId: manifest.reviewId,
      }),
    });
  } catch {
    button.disabled = false;
    setApprovalStatus("Approval could not reach the private review service.", "error");
    return;
  }

  if (response.status === 409) {
    setReloadVisible(true);
    setApprovalStatus("Review changed or expired before approval. Reload before approving.", "error");
    return;
  }
  if (response.status === 403) {
    setReloadVisible(true);
    setApprovalStatus("Approval requires the repository owner session.", "error");
    return;
  }
  if (!response.ok) {
    button.disabled = false;
    setApprovalStatus(`Approval failed (HTTP ${response.status}).`, "error");
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    button.disabled = false;
    setApprovalStatus("Approval response could not be read.", "error");
    return;
  }

  if (!isApprovalRecord(payload) || !sameApproval(payload, manifest)) {
    button.disabled = false;
    setApprovalStatus("Approval response does not match the displayed review.", "error");
    return;
  }

  button.textContent = "Approved";
  setApprovalStatus(
    `Approved ${approvalTimestamp(payload.approvedAt)} for this exact Review.`,
    "ready",
  );
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

  currentReview = payload;
  setText(
    "review-status",
    `Captured ${new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(payload.capturedAt))}.`,
  );
  const status = document.getElementById("review-status");
  if (status !== null) status.dataset.state = "ready";

  setText("review-case", payload.caseId);
  setText("review-sha", payload.sourceSha);
  setText("review-depth", payload.reviewDepth);
  renderEvidence(payload);
  setApprovalAvailable(true);
  setBusy(false);
  await loadBaselineStatus(payload);
}

const reload = document.getElementById("review-reload");
if (reload instanceof HTMLButtonElement) {
  reload.addEventListener("click", () => window.location.reload());
}

const approve = approvalButton();
if (approve !== null) {
  approve.addEventListener("click", () => {
    void approveCurrentReview();
  });
}

void loadReview();
