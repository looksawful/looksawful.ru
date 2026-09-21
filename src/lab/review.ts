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
  caseId: string;
  sourceSha: string;
  reviewDepth: ReviewDepth;
  capturedAt: string;
  evidence: ReviewEvidence[];
};

function setText(id: string, value: string): void {
  const node = document.getElementById(id);
  if (node !== null) node.textContent = value;
}

function isEvidence(value: unknown): value is ReviewEvidence {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.kind === "string" &&
    typeof candidate.contentType === "string" &&
    typeof candidate.url === "string" &&
    candidate.url.startsWith("/lab/review/evidence/")
  );
}

function isManifest(value: unknown): value is ReviewManifest {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.version === 1 &&
    typeof candidate.caseId === "string" &&
    typeof candidate.sourceSha === "string" &&
    (candidate.reviewDepth === "quick" ||
      candidate.reviewDepth === "interactive" ||
      candidate.reviewDepth === "full") &&
    typeof candidate.capturedAt === "string" &&
    Array.isArray(candidate.evidence) &&
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

    const image = document.createElement("img");
    image.src = item.url;
    image.alt = `${manifest.caseId} ${item.kind} review evidence ${item.id}`;
    image.loading = "eager";
    image.decoding = "async";

    const caption = document.createElement("figcaption");
    caption.textContent = `${item.kind} · ${item.id}`;

    figure.append(image, caption);
    root.append(figure);
  }
}

async function loadReview(): Promise<void> {
  let response: Response;
  try {
    response = await fetch("/lab/review/api", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    setText("review-status", "Private review evidence could not be loaded.");
    return;
  }

  if (response.status === 404) {
    setText("review-status", "No current private review.");
    return;
  }
  if (!response.ok) {
    setText("review-status", "Private review evidence is unavailable.");
    return;
  }

  const payload: unknown = await response.json();
  if (!isManifest(payload)) {
    setText("review-status", "Private review manifest is invalid.");
    return;
  }

  setText("review-status", `Captured ${new Date(payload.capturedAt).toLocaleString()}.`);
  setText("review-case", payload.caseId);
  setText("review-sha", payload.sourceSha);
  setText("review-depth", payload.reviewDepth);
  renderEvidence(payload);
}

void loadReview();
