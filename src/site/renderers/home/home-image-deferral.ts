import { heroMediaAssets } from "../../../data/media/assets/hero.ts";
import { responsiveImageSrcSet } from "../../../data/media/responsive.ts";

const HERO_PORTRAIT = heroMediaAssets[0];
const HERO_SIZES = "(max-width: 32rem) 105vw, (max-width: 48rem) 92vw, (max-width: 64rem) 48vw, 35vw";

const HOME_IMAGE_LOADER = `<script type="module" data-home-image-loader>
(() => {
  const images = [...document.querySelectorAll('img[data-home-image-deferred]')];
  if (!images.length) return;

  const hydrate = (image) => {
    const sizes = image.dataset.homeSizes;
    const srcset = image.dataset.homeSrcset;
    const src = image.dataset.homeSrc;

    if (sizes) image.sizes = sizes;
    if (srcset) image.srcset = srcset;
    if (src) image.src = src;

    delete image.dataset.homeSizes;
    delete image.dataset.homeSrcset;
    delete image.dataset.homeSrc;
    delete image.dataset.homeImageDeferred;
  };

  if (typeof IntersectionObserver !== 'function') {
    images.forEach(hydrate);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const image = entry.target;
      observer.unobserve(image);
      hydrate(image);
    }
  }, { rootMargin: '75% 0px', threshold: 0 });

  images.forEach((image) => observer.observe(image));
})();
</script>`;

function moveAttribute(tag: string, name: string, dataName: string): string {
  const pattern = new RegExp(`\\s${name}="([^"]*)"`, "i");
  const match = tag.match(pattern);
  if (!match) return tag;
  return tag.replace(pattern, ` ${dataName}="${match[1]}"`);
}

function shouldKeepImageEager(tag: string): boolean {
  return /\sfetchpriority="high"/i.test(tag) || /\sloading="eager"/i.test(tag);
}

function enrichHeroPortrait(tag: string): string {
  if (!/hero-portrait\.webp/i.test(tag) || !/\sfetchpriority="high"/i.test(tag)) return tag;

  const srcset = responsiveImageSrcSet(HERO_PORTRAIT);
  if (!srcset) return tag;

  return tag.replace(
    />$/,
    ` width="${HERO_PORTRAIT.width}" height="${HERO_PORTRAIT.height}" sizes="${HERO_SIZES}" srcset="${srcset}">`,
  );
}

function deferImageTag(tag: string): string {
  if (shouldKeepImageEager(tag)) return enrichHeroPortrait(tag);

  let next = moveAttribute(tag, "sizes", "data-home-sizes");
  next = moveAttribute(next, "srcset", "data-home-srcset");
  next = moveAttribute(next, "src", "data-home-src");

  if (!/\sdata-home-src="/i.test(next)) return tag;
  return next.replace(/>$/, ' data-home-image-deferred="">');
}

export function deferHomepageLazyImages(html: string): string {
  const withDeferredImages = html.replace(/<img\b[^>]*>/gi, deferImageTag);
  if (withDeferredImages === html) return html;
  if (/\bdata-home-image-loader\b/i.test(withDeferredImages)) return withDeferredImages;
  if (!/<\/body>/i.test(withDeferredImages)) {
    throw new Error("Homepage is missing </body> for deferred image loader");
  }

  return withDeferredImages.replace(/<\/body>/i, `${HOME_IMAGE_LOADER}\n</body>`);
}
