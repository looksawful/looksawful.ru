import { prepareHomepagePublication } from "./homepage-publication.js";
import { initRuntime } from "./runtime/init-runtime.js";

prepareHomepagePublication(document);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void initRuntime(document);
  }, { once: true });
} else {
  void initRuntime(document);
}
