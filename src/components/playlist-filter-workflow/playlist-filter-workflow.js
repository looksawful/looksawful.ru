import template from "./playlist-filter-workflow.html?raw";
import styles from "./playlist-filter-workflow.css?raw";
import { initializePlaylistFilterWorkflow } from "./playlist-filter-workflow-runtime.js";

const ELEMENT_NAME = "playlist-filter-workflow";

class PlaylistFilterWorkflow extends HTMLElement {
  #destroy = null;

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this.#destroy?.();
    this.shadowRoot.innerHTML = `<style>${styles}</style>${template}`;
    this.#destroy = initializePlaylistFilterWorkflow(this.shadowRoot);
  }

  disconnectedCallback() {
    this.#destroy?.();
    this.#destroy = null;
    this.shadowRoot?.replaceChildren();
  }
}

if (!customElements.get(ELEMENT_NAME)) {
  customElements.define(ELEMENT_NAME, PlaylistFilterWorkflow);
}
