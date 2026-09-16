(() => {
  const root = document.documentElement;
  const script = document.currentScript;
  const isSurface = (value) => value === "light" || value === "dark";
  const fallback = isSurface(root.dataset.surfaceDefault) ? root.dataset.surfaceDefault : "light";
  const identity = root.dataset.pageId || location.pathname || "page";
  const key = `looksawful:surface:v1:${identity}`;
  const colors = { light: "#f3f3ef", dark: "#0b0b0a" };
  let surface = fallback;

  try {
    const stored = localStorage.getItem(key);
    if (isSurface(stored)) surface = stored;
  } catch {}

  const syncChrome = () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", colors[surface]);
  };

  const syncToggle = (toggle) => {
    toggle.setAttribute("aria-pressed", String(surface === "dark"));
    toggle.setAttribute("aria-label", surface === "dark" ? "???????? ??????? ???" : "???????? ?????? ???");
  };

  const apply = (next) => {
    surface = next;
    root.dataset.surface = next;
    if (document.body) document.body.dataset.surface = next;
    syncChrome();
    document.querySelectorAll("[data-surface-toggle]").forEach(syncToggle);
  };

  apply(surface);
  const bootstrapOnly = script instanceof HTMLScriptElement && script.dataset.surfaceMode === "bootstrap";

  const bind = () => {
    syncChrome();
    if (bootstrapOnly) return;
    document.querySelectorAll("[data-surface-toggle]").forEach((toggle) => {
      syncToggle(toggle);
      toggle.addEventListener("click", () => {
        const next = surface === "dark" ? "light" : "dark";
        apply(next);
        try { localStorage.setItem(key, next); } catch {}
      });
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
})();
