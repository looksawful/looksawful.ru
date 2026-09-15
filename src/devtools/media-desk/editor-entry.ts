import "./desk.css";
import "./auth-controls.css";
import { mountMediaDeskModeStatus } from "./mode-status.ts";
import { installRevisionAwareMediaFetch } from "./revision-client.ts";

const url = new URL(location.href);
if (url.searchParams.has("view")) {
  url.searchParams.delete("view");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function mountRemoteAuthControls(): void {
  if (import.meta.env.VITE_CONTENT_DESK_REMOTE !== "1") return;

  const form = document.createElement("form");
  form.className = "media-desk-auth-controls";
  form.method = "post";
  form.action = "/logout";

  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Выйти";
  form.append(button);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    button.disabled = true;
    void fetch("/logout", {
      method: "POST",
      credentials: "same-origin",
    }).then((response) => {
      if (!response.ok) throw new Error(`Logout failed with HTTP ${response.status}`);
      location.assign("/login");
    }).catch(() => {
      button.disabled = false;
    });
  });

  document.body.prepend(form);
}

async function bootMediaDesk(): Promise<void> {
  mountMediaDeskModeStatus();
  mountRemoteAuthControls();
  installRevisionAwareMediaFetch();
  await import("./main.ts");
  await import("./editor.ts");
  await import("./inventory-readonly.ts");
}

void bootMediaDesk();
