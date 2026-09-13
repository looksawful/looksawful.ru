import "./mode-status.css";

const READ_ONLY_MODE = "READ ONLY";
const WRITE_MODE = "WRITE";

function env(name: string): string {
  const value = import.meta.env[name];
  return typeof value === "string" && value.length > 0 ? value : "unknown";
}

function shortRevision(value: string): string {
  return value === "unknown" ? value : value.slice(0, 12);
}

export function mountMediaDeskModeStatus(): void {
  const writeMode = import.meta.env.VITE_CONTENT_DESK_MODE === "write";
  const mode = writeMode ? WRITE_MODE : READ_ONLY_MODE;
  const branch = env("VITE_CONTENT_DESK_BRANCH");
  const head = env("VITE_CONTENT_DESK_HEAD");
  const dirty = import.meta.env.VITE_CONTENT_DESK_DIRTY === "1";
  const divergence = env("VITE_CONTENT_DESK_DEV_DIVERGENCE");

  const status = document.createElement("aside");
  status.className = "media-desk-mode-status";
  status.dataset.mode = writeMode ? "write" : "read-only";
  status.setAttribute("role", "status");
  status.setAttribute("aria-label", "Media Desk mode and repository provenance");

  const modeLabel = document.createElement("strong");
  modeLabel.textContent = mode;

  const provenance = document.createElement("span");
  provenance.textContent = `${branch} · ${shortRevision(head)} · ${dirty ? "dirty" : "clean"} · dev ${divergence}`;

  status.append(modeLabel, provenance);
  document.body.prepend(status);
}
