const gallerySources = {
  "jestei-brand-identity": import.meta.glob(
    "../assets/cv/auto-galleries/jestei-brand-identity-masonry/*.{jpg,jpeg,png,webp,avif}",
    {
      eager: true,
      query: "?url",
      import: "default"
    }
  )
};

function naturalSortEntries(entries) {
  return entries.sort(function (a, b) {
    return a[0].localeCompare(b[0], undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });
}

function renderMasonry(host) {
  const galleryName = host.dataset.cvAutoMasonry;
  const sourceMap = gallerySources[galleryName] || {};
  const images = naturalSortEntries(Object.entries(sourceMap))
    .map(function (entry) {
      return entry[1];
    })
    .slice(0, 7);

  if (!images.length) return;

  host.textContent = "";

  images.forEach(function (src, index) {
    const link = document.createElement("a");
    link.className = "cv-auto-masonry__item";
    link.href = src;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "open gallery image " + (index + 1));

    const img = document.createElement("img");
    img.className = "cv-auto-masonry__media";
    img.src = src;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";

    link.appendChild(img);
    host.appendChild(link);
  });
}

function initAutoMasonry() {
  document.querySelectorAll("[data-cv-auto-masonry]").forEach(renderMasonry);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAutoMasonry);
} else {
  initAutoMasonry();
}
