import { prepareHomepagePublication } from "./homepage-publication.js";
import { initRuntime } from "./runtime/init-runtime.js";

document
  .querySelectorAll("[data-hero-only-mode], #hero-only-inline-mode")
  .forEach((node) => node.remove());

prepareHomepagePublication(document);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void initRuntime(document);
  }, { once: true });
} else {
  void initRuntime(document);
}
