export { initMediaSliderDotsProximity } from "./components/proximity-components.js";

import { initMediaSliderDotsProximity } from "./components/proximity-components.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMediaSliderDotsProximity, {
    once: true,
  });
} else {
  initMediaSliderDotsProximity();
}
