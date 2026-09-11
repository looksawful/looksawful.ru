import "./mode-status.css";

function env(value: string | undefined): string {
  return value && value.length > 0 ? value : "unknown";
}

function shortRevision(value: string): string {
  return value === "unknown" ? value : value.slice(0, 12);
}

export function mountMediaDeskModeStatus(): void {
  const writeMode = import.meta.env.VITE_CONTENT_DESK_MODE === "write";
  const branch = env(import.meta.env.VITE_CONTENT_DESK_BRANCH);
  const head = env(import.meta.env.VITE_CONTENT_DESK_HEAD);
  const prodBase = env(import.meta.env.VITE_CONTENT_DESK_PROD_BASE);
  const prodDivergence = env(import.meta.env.VITE_CONTENT_DESK_PROD_DIVERGENCE);
  const dirty = import.meta.env.VITE_CONTENT_DESK_DIRTY === "1";

  const status = document.createElement("aside");
  status.className = "media-desk-mode-status";
  status.dataset.mode = writeMode ? "write" : "read-only";
  status.setAttribute("role", "status");
  status.setAttribute("aria-label", "Media Desk mode and repository provenance");

  const mode = document.createElement("strong");
  mode.textContent = writeMode ? "WRITE" : "READ ONLY";

  const provenance = document.createElement("span");
  provenance.textContent = [
    branch,
    `HEAD ${shortRevision(head)}`,
    `prod ${shortRevision(prodBase)}`,
    `Δ ${prodDivergence}`,
    dirty ? "dirty" : "clean",
  ].join(" · ");

  status.append(mode, provenance);
  document.body.prepend(status);
}
