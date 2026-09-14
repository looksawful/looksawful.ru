import "./desk.css";
import { mountMediaDeskModeStatus } from "./mode-status.ts";
import { installRevisionAwareMediaFetch } from "./revision-client.ts";

const url = new URL(location.href);
if (url.searchParams.has("view")) {
  url.searchParams.delete("view");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

async function bootMediaDesk(): Promise<void> {
  mountMediaDeskModeStatus();
  installRevisionAwareMediaFetch();
  await import("./main.ts");
  await import("./editor.ts");
  await import("./inventory-readonly.ts");
}

void bootMediaDesk();
