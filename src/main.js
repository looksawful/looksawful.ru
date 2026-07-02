import { initRuntime } from "./runtime/init-runtime.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    void initRuntime(document);
  }, { once: true });
} else {
  void initRuntime(document);
}