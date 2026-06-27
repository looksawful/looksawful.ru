const STAGE = 'stage03GallerySystem';

const EXCLUDED_ROOTS = [
  '#hero',
  '#resume',
  '[data-site-header]',
  '.site-header',
  '.jestei-policy-marquee',
  '.policy-book',
  '.playlist-filter-embed',
  '[data-playlist-filter]',
  '[data-visual-demo]',
  '[data-cv-min-height]'
];

const GALLERY_SELECTORS = [
  '.media-slider',
  '[data-media-slider]',
  '.media-marquee[data-media-marquee]',
  '.media-banner',
  '.media-figure',
  '.media-quad',
  '.media-three',
  '.media-six',
  '.media-eight',
  '.media-grid',
  '.media-stack',
  '.media-strip',
  '.media-ribbon',
  '.media-masonry',
  '.diagonal-masonry',
  '.centered-quad',
  '.media-centered-quad',
  '.media-vertical-three',
  '.media-horizontal',
  '.media-landscape',
  '.media-portrait',
  '.random-gallery'
].join(',');

function isInsideExcludedRoot(node) {
  if (!node || typeof node.closest !== 'function') return true;
  return EXCLUDED_ROOTS.some((selector) => node.closest(selector));
}

function getMediaItems(root) {
  if (!root) return [];
  const directMediaItems = Array.from(root.children || []).filter((child) => {
    if (!(child instanceof HTMLElement)) return false;
    return child.matches('.media-item, a, figure, picture, video') && child.querySelector('img, picture, video');
  });

  if (directMediaItems.length) return directMediaItems;

  return Array.from(root.querySelectorAll(':scope > .media-item, :scope > a.media-item, :scope > figure.media-item')).filter((item) => item.querySelector('img, picture, video'));
}

function hasOnlyMedia(root) {
  const meaningfulChildren = Array.from(root.children || []).filter((child) => {
    if (!(child instanceof HTMLElement)) return false;
    if (child.matches('script, style')) return false;
    return child.textContent.trim() || child.querySelector('img, picture, video, canvas');
  });

  if (!meaningfulChildren.length) return false;

  return meaningfulChildren.every((child) => {
    return child.matches('.media-item, a, figure, picture, video, img, .media-marquee__track, .media-slider__track') ||
      child.querySelector('img, picture, video');
  });
}

function getType(root, items) {
  if (root.matches('.media-marquee[data-media-marquee], .media-strip, .media-ribbon')) return 'scroll';
  if (root.matches('.media-slider, [data-media-slider]')) return 'carousel';
  if (root.matches('.media-banner, .media-figure')) return 'banner';
  if (items.length <= 1) return 'banner';
  return 'tiles';
}

function tagGallery(root) {
  if (!(root instanceof HTMLElement)) return;
  if (isInsideExcludedRoot(root)) return;
  if (root.dataset.stage03Gallery) return;
  if (!root.querySelector('img, picture, video')) return;
  if (root.querySelector('canvas') && !root.querySelector('img, picture, video')) return;
  if (!hasOnlyMedia(root) && !root.matches('.media-banner, .media-figure, .media-marquee, .media-slider, [data-media-slider]')) return;

  const items = getMediaItems(root);
  const fallbackItems = items.length ? items : Array.from(root.querySelectorAll('.media-item')).filter((item) => item.querySelector('img, picture, video'));
  const type = getType(root, fallbackItems);

  root.dataset.stage03Gallery = type;
  root.dataset.stage03Count = String(fallbackItems.length || root.querySelectorAll('img, picture, video').length);
  root.classList.add('stage-03-gallery', `stage-03-gallery--${type}`);

  fallbackItems.forEach((item, index) => {
    if (!(item instanceof HTMLElement)) return;
    item.dataset.stage03GalleryItem = '';
    item.style.setProperty('--stage-03-item-index', String(index));
    if (type === 'carousel' || type === 'scroll') {
      item.setAttribute('tabindex', item.getAttribute('tabindex') || '0');
    }
  });

  const track = root.querySelector('.media-slider__track, .media-marquee__track, [data-media-marquee-track]');
  if (track instanceof HTMLElement) {
    track.dataset.stage03GalleryTrack = '';
  }

  if (type === 'carousel' && !root.dataset.stage03Enhanced) {
    root.dataset.stage03Enhanced = 'true';
    root.setAttribute('aria-roledescription', root.getAttribute('aria-roledescription') || 'carousel');
  }
}

function tagAllGalleries() {
  document.querySelectorAll(GALLERY_SELECTORS).forEach(tagGallery);
}

function repairMobileOverflow() {
  document.documentElement.classList.add('stage-03-gallery-system-ready');
  document.body.classList.add('stage-03-gallery-system-ready');
}

export function initRestructureStage03() {
  if (document.documentElement.dataset[STAGE] === 'true') return;
  document.documentElement.dataset[STAGE] = 'true';

  tagAllGalleries();
  repairMobileOverflow();

  const observer = new MutationObserver((mutations) => {
    let shouldRetag = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        shouldRetag = true;
        break;
      }
    }
    if (shouldRetag) tagAllGalleries();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}
