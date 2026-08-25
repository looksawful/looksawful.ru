import type { ClientLogoData } from "../data/clients.ts";
import { escapeHtml } from "../utils/html.ts";

export function renderClientLogo(logo: ClientLogoData): string {
  const alt = logo.alt ?? logo.name;

  const src = `/media/clients/logo-wall/client-logo-${logo.file}.webp`;

  return `
    <figure
      class="media portfolio-logo-wall__item"
      data-lightbox="off"
      data-infinite-reel-item
      aria-label="${escapeHtml(alt)}"
    >
      <div
        class="media__surface"
        style="--media-ratio: 1200 / 496; --media-surface-bg: var(--clr-bg)"
      >
        <img
          alt="${escapeHtml(alt)}"
          decoding="async"
          height="496"
          src="${escapeHtml(src)}"
          style="mix-blend-mode: darken"
          width="1200"
        >
      </div>
    </figure>
  `;
}
