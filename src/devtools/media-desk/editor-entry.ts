import "./desk.css";
import "./auth-controls.css";

const url = new URL(location.href);
if (url.searchParams.has("view")) {
  url.searchParams.delete("view");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function mountNetworkSessionControls(): void {
  if (import.meta.env.VITE_MEDIA_DESK_AUTH !== "1") return;

  const form = document.createElement("form");
  form.className = "media-desk-session";
  form.method = "post";
  form.action = "/__media-desk/auth/logout";

  const button = document.createElement("button");
  button.className = "media-desk-session__logout";
  button.type = "submit";
  button.textContent = "Выйти";

  form.append(button);
  document.body.append(form);
}

async function bootMediaDesk(): Promise<void> {
  await import("./main.ts");
  await import("./editor.ts");
  mountNetworkSessionControls();
}

void bootMediaDesk();
