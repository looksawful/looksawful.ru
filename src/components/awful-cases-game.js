import { enhanceAwfulCases } from "./awful-cases-runtime.js";

const root = document.querySelector("[data-awful-cases]");

if (root instanceof HTMLElement) {
  const runtime = enhanceAwfulCases(root, { locale: "ru" });
  let nearViewport = typeof IntersectionObserver !== "function";
  let observer = null;

  const syncActive = () => runtime.setActive(nearViewport && !document.hidden);

  if (typeof IntersectionObserver === "function") {
    observer = new IntersectionObserver(
      (entries) => {
        nearViewport = entries.some((entry) => entry.isIntersecting);
        syncActive();
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(root);
  }

  document.addEventListener("visibilitychange", syncActive);
  syncActive();

  window.addEventListener(
    "pagehide",
    () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", syncActive);
      runtime.destroy();
    },
    { once: true },
  );
}
