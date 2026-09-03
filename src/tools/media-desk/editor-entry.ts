import "./desk.css";

const url = new URL(location.href);
if (url.searchParams.has("view")) {
  url.searchParams.delete("view");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

async function bootMediaDesk(): Promise<void> {
  await import("./main.ts");
  await import("./editor.ts");
}

void bootMediaDesk();
