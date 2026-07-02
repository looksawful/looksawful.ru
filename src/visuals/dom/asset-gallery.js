/* standalone asset gallery filter */
(() => {
  const root = document.querySelector("[data-asset-filter]");
  const grid = document.querySelector("[data-asset-grid]");
  const filterButtons = [...document.querySelectorAll("[data-filter-group]")];
  const sortButtons = [...document.querySelectorAll("[data-sort-value]")];
  const resetButton = document.querySelector("[data-filter-reset]");
  const statusNode = document.querySelector(".asset-status");
  const summaryNode = document.querySelector("[data-filter-summary]");
  const tagNode = document.querySelector("[data-filter-tags]");
  const emptyState = document.querySelector("[data-empty-state]");

  if (!root || !grid) return;

  const labels = {
    "showcase-family-item": "проект",
    type: "тип",
    category: "категория",
    tags: "тег",
  };

  const readable = new Map(
    [...filterButtons, ...sortButtons].map((button) => [
      button.dataset.filterValue || button.dataset.sortValue,
      button.textContent.trim(),
    ]),
  );

  const filterGroups = ["project", "type", "category", "tags"];

  const createGroupState = () => Object.fromEntries(filterGroups.map((group) => [group, new Set()]));

  const state = {
    filters: createGroupState(),
    excludes: createGroupState(),
    sort: "default",
  };

  let cards = [];
  let clickTimer = 0;
  let lightboxNode = null;
  let lightboxMediaHost = null;
  let lightboxCounter = null;
  let lightboxTitle = null;
  let activeLightboxIndex = -1;
  let touchStartX = 0;

  function getCardValues(card, group) {
    if (group === "tags") {
      return String(card.dataset.tags || "")
        .split(/\s+/)
        .filter(Boolean);
    }

    return [card.dataset[group]].filter(Boolean);
  }

  function groupMatches(card, group, values) {
    if (!values.size) return true;
    const cardValues = getCardValues(card, group);
    return [...values].some((value) => cardValues.includes(value));
  }

  function groupExcluded(card, group, values) {
    if (!values.size) return false;
    const cardValues = getCardValues(card, group);
    return [...values].some((value) => cardValues.includes(value));
  }

  function cardMatches(card) {
    return filterGroups.every((group) => {
      if (groupExcluded(card, group, state.excludes[group])) return false;
      return groupMatches(card, group, state.filters[group]);
    });
  }

  function collectCards() {
    cards = [...grid.querySelectorAll("[data-asset-card]")];

    cards.forEach((card, index) => {
      card.dataset.index = String(index);
    });
  }

  function updatePressedState() {
    for (const group of filterGroups) {
      const values = state.filters[group] || new Set();
      const excludes = state.excludes[group] || new Set();
      const groupButtons = filterButtons.filter((button) => button.dataset.filterGroup === group);

      for (const button of groupButtons) {
        const value = button.dataset.filterValue;
        const isAll = value === "*";
        const included = !isAll && values.has(value);
        const excluded = !isAll && excludes.has(value);
        button.setAttribute("aria-pressed", isAll ? String(values.size === 0 && excludes.size === 0) : String(included));
        button.dataset.filterMode = excluded ? "exclude" : included ? "include" : isAll ? "all" : "none";
      }
    }

    for (const button of sortButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.sortValue === state.sort));
    }
  }

  function sortCards() {
    const ordered = [...cards];

    if (state.sort === "video") {
      ordered.sort((a, b) => {
        const av = a.dataset.type === "video" ? 0 : 1;
        const bv = b.dataset.type === "video" ? 0 : 1;
        return av - bv || Number(a.dataset.index) - Number(b.dataset.index);
      });
    }

    if (state.sort === "tall") {
      ordered.sort((a, b) => {
        const av = Number(a.dataset.ratio || 1);
        const bv = Number(b.dataset.ratio || 1);
        return av - bv || Number(a.dataset.index) - Number(b.dataset.index);
      });
    }

    for (const card of ordered) {
      grid.append(card);
    }
  }

  function getActiveLabels() {
    const result = [];

    for (const group of filterGroups) {
      for (const value of state.filters[group]) {
        result.push(`${labels[group]}: ${readable.get(value) || value}`);
      }
      for (const value of state.excludes[group]) {
        result.push(`без ${labels[group]}: ${readable.get(value) || value}`);
      }
    }

    if (state.sort !== "default") {
      result.push(`порядок: ${readable.get(state.sort) || state.sort}`);
    }

    return result;
  }

  function renderSummary(visibleCount) {
    const active = getActiveLabels();
    const hasActiveFilters = active.length > 0;

    statusNode?.classList.toggle("is-visible", hasActiveFilters);
    if (summaryNode) summaryNode.textContent = "";
    if (tagNode) tagNode.innerHTML = "";

    if (hasActiveFilters && tagNode) {
      for (const label of active) {
        const tag = document.createElement("span");
        tag.className = "asset-status__tag";
        tag.textContent = label;
        tagNode.append(tag);
      }
    }

    emptyState?.classList.toggle("is-visible", visibleCount === 0);
  }

  function applyFilters() {
    let visibleCount = 0;

    for (const card of cards) {
      const visible = cardMatches(card);
      card.classList.toggle("is-hidden", !visible);
      card.hidden = !visible;

      if (visible) visibleCount += 1;
    }

    sortCards();
    updatePressedState();
    renderSummary(visibleCount);
  }

  function toggleFilter(button) {
    const group = button.dataset.filterGroup;
    const value = button.dataset.filterValue;
    const values = state.filters[group];
    const excludes = state.excludes[group];

    if (!group || !value || !values || !excludes) return;

    if (value === "*") {
      values.clear();
      excludes.clear();
      applyFilters();
      return;
    }

    excludes.delete(value);

    if (values.has(value)) {
      values.delete(value);
    } else {
      values.add(value);
    }

    applyFilters();
  }

  function toggleExclude(button) {
    const group = button.dataset.filterGroup;
    const value = button.dataset.filterValue;
    const values = state.filters[group];
    const excludes = state.excludes[group];

    if (!group || !value || value === "*" || !values || !excludes) return;

    values.delete(value);

    if (excludes.has(value)) {
      excludes.delete(value);
    } else {
      excludes.add(value);
    }

    applyFilters();
  }

  function createMedia(asset) {
    const media = document.createElement(asset.type === "video" ? "video" : "img");
    media.className = "asset-card__asset";

    if (asset.type === "video") {
      media.src = asset.src;
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.preload = "metadata";
      if (asset.poster) media.poster = asset.poster;
    } else {
      media.src = asset.src;
      media.alt = asset.alt || "";
      media.loading = "lazy";
      media.decoding = "async";
    }

    return media;
  }

  function renderCard(asset, index) {
    const article = document.createElement("article");
    const variant = asset.variant || "wide";
    const tags = Array.isArray(asset.tags) ? asset.tags : [];

    article.className = `asset-card asset-card--${variant}`;
    article.dataset.assetCard = "";
    article.dataset.showcaseItem = asset.showcaseItem || "";
    article.dataset.type = asset.type || "image";
    article.dataset.category = asset.category || "";
    article.dataset.tags = tags.join(" ");
    article.dataset.ratio = String(asset.ratio || 1);
    article.dataset.index = String(index);
    article.dataset.src = asset.src || "";
    article.dataset.assetTitle = asset.title || "";
    article.dataset.assetType = asset.type || "image";
    if (asset.poster) article.dataset.poster = asset.poster;

    const link = document.createElement("a");
    link.className = "asset-card__link";
    link.href = asset.src;
    link.dataset.assetLightboxTrigger = "";
    link.setAttribute("aria-label", "открыть ассет");

    const mediaFrame = document.createElement("span");
    mediaFrame.className = "asset-card__media";

    const media = createMedia(asset);
    mediaFrame.append(media);

    if (asset.type === "video") {
      const play = document.createElement("span");
      play.className = "asset-card__play";
      play.textContent = "▶";
      mediaFrame.append(play);

      mediaFrame.addEventListener("pointerenter", () => {
        media.play().catch(() => {});
      });
      mediaFrame.addEventListener("pointerleave", () => {
        media.pause();
      });
    }

    link.append(mediaFrame);

    article.append(link);

    return article;
  }

  function getVisibleCards() {
    return cards.filter((card) => !card.hidden && !card.classList.contains("is-hidden"));
  }

  function createLightbox() {
    if (lightboxNode) return lightboxNode;

    lightboxNode = document.createElement("section");
    lightboxNode.className = "asset-lightbox";
    lightboxNode.setAttribute("aria-hidden", "true");
    lightboxNode.setAttribute("aria-label", "просмотр ассета");
    lightboxNode.setAttribute("role", "dialog");
    lightboxNode.innerHTML = `
      <div class="asset-lightbox__dialog">
        <div class="asset-lightbox__toolbar">
          <span class="asset-lightbox__title"></span>
          <span class="asset-lightbox__counter"></span>
          <button class="asset-lightbox__button asset-lightbox__button--close" type="button" aria-label="закрыть">×</button>
        </div>
        <button class="asset-lightbox__nav asset-lightbox__nav--prev" type="button" aria-label="предыдущий ассет">‹</button>
        <div class="asset-lightbox__media"></div>
        <button class="asset-lightbox__nav asset-lightbox__nav--next" type="button" aria-label="следующий ассет">›</button>
      </div>
    `;

    lightboxMediaHost = lightboxNode.querySelector(".asset-lightbox__media");
    lightboxCounter = lightboxNode.querySelector(".asset-lightbox__counter");
    lightboxTitle = lightboxNode.querySelector(".asset-lightbox__title");

    lightboxNode.querySelector(".asset-lightbox__button--close")?.addEventListener("click", closeLightbox);
    lightboxNode.querySelector(".asset-lightbox__nav--prev")?.addEventListener("click", () => moveLightbox(-1));
    lightboxNode.querySelector(".asset-lightbox__nav--next")?.addEventListener("click", () => moveLightbox(1));
    lightboxNode.addEventListener("click", (event) => {
      if (event.target === lightboxNode) closeLightbox();
    });
    lightboxNode.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0]?.clientX || 0;
    }, { passive: true });
    lightboxNode.addEventListener("touchend", (event) => {
      const delta = (event.changedTouches[0]?.clientX || 0) - touchStartX;
      if (Math.abs(delta) < 44) return;
      moveLightbox(delta < 0 ? 1 : -1);
    }, { passive: true });

    document.body.append(lightboxNode);
    return lightboxNode;
  }

  function renderLightboxCard(card) {
    if (!lightboxMediaHost) return;

    const src = card.dataset.src;
    const type = card.dataset.assetType;
    const title = card.dataset.assetTitle || card.querySelector(".asset-card__pill")?.textContent || "ассет";
    const visible = getVisibleCards();

    lightboxMediaHost.replaceChildren();

    const media = document.createElement(type === "video" ? "video" : "img");
    media.className = "asset-lightbox__asset";
    media.src = src;

    if (type === "video") {
      media.controls = true;
      media.autoplay = true;
      media.playsInline = true;
      media.muted = true;
      if (card.dataset.poster) media.poster = card.dataset.poster;
    } else {
      media.alt = title;
      media.decoding = "async";
    }

    lightboxMediaHost.append(media);
    if (lightboxTitle) lightboxTitle.textContent = "";
    if (lightboxCounter) lightboxCounter.textContent = `${activeLightboxIndex + 1}/${visible.length}`;
  }

  function openLightbox(card) {
    const visible = getVisibleCards();
    const index = visible.indexOf(card);
    if (index < 0) return;

    createLightbox();
    activeLightboxIndex = index;
    renderLightboxCard(card);
    lightboxNode.classList.add("is-open");
    lightboxNode.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("has-asset-lightbox");
    lightboxNode.querySelector(".asset-lightbox__button--close")?.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!lightboxNode) return;

    lightboxNode.classList.remove("is-open");
    lightboxNode.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("has-asset-lightbox");
    lightboxMediaHost?.replaceChildren();
    activeLightboxIndex = -1;
  }

  function moveLightbox(direction) {
    const visible = getVisibleCards();
    if (!visible.length || activeLightboxIndex < 0) return;

    activeLightboxIndex = (activeLightboxIndex + direction + visible.length) % visible.length;
    renderLightboxCard(visible[activeLightboxIndex]);
  }

  async function loadManifest() {
    const manifestUrl = grid.dataset.assetManifest || "/assets/gallery/manifest.json";
    const response = await fetch(manifestUrl, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`manifest ${response.status}`);
    }

    const manifest = await response.json();
    const items = Array.isArray(manifest.items) ? manifest.items : [];

    if (!items.length) return;

    grid.replaceChildren(...items.map(renderCard));
  }

  root.addEventListener("click", (event) => {
    const filterButton = event.target.closest("[data-filter-group]");
    if (filterButton) {
      window.clearTimeout(clickTimer);
      clickTimer = window.setTimeout(() => toggleFilter(filterButton), 180);
      return;
    }

    const sortButton = event.target.closest("[data-sort-value]");
    if (sortButton) {
      state.sort = sortButton.dataset.sortValue || "default";
      applyFilters();
    }
  });

  grid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-asset-lightbox-trigger]");
    if (!trigger) return;

    const card = trigger.closest("[data-asset-card]");
    if (!card) return;

    event.preventDefault();
    openLightbox(card);
  });

  window.addEventListener("keydown", (event) => {
    if (!lightboxNode?.classList.contains("is-open")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") moveLightbox(-1);
    if (event.key === "ArrowRight") moveLightbox(1);
  });

  root.addEventListener("dblclick", (event) => {
    const filterButton = event.target.closest("[data-filter-group]");
    if (!filterButton) return;
    window.clearTimeout(clickTimer);
    toggleExclude(filterButton);
  });

  resetButton?.addEventListener("click", () => {
    for (const values of Object.values(state.filters)) values.clear();
    for (const values of Object.values(state.excludes)) values.clear();
    state.sort = "default";
    applyFilters();
  });

  loadManifest()
    .catch(() => {})
    .finally(() => {
      collectCards();
      applyFilters();
    });
})();
