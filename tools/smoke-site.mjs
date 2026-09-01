import { waitForDocumentReady, waitForAnimationFrames, waitForLightboxClosed } from "./e2e/readiness.mjs";
import { isDirectExecution, withE2ERuntime } from "./e2e/runtime.mjs";

let BASE_URL = "";
const PAGE_FLIP_SRC = "https://unpkg.com/page-flip@2.0.7/dist/js/page-flip.browser.js";
const PAGE_FLIP_LIBRARY_FIXTURE = `
window.St = window.St || {};
window.St.PageFlip = class SmokePageFlip {
  constructor(book) {
    this.book = book;
    this.events = new Map();
    this.index = 0;
    this.pages = [];
  }

  on(eventName, callback) {
    const callbacks = this.events.get(eventName) || [];
    callbacks.push(callback);
    this.events.set(eventName, callbacks);
  }

  emit(eventName, event) {
    (this.events.get(eventName) || []).forEach((callback) => callback(event));
  }

  loadFromHTML(pages) {
    this.pages = [...pages];
    this.emit("init", { data: this.book?.getBoundingClientRect?.().width <= 800 ? "portrait" : "landscape" });
  }

  getCurrentPageIndex() {
    return this.index;
  }

  getPageCount() {
    return this.pages.length;
  }

  flipPrev() {
    this.index = Math.max(0, this.index - 1);
    this.emit("flip", { data: this.index });
  }

  flipNext() {
    this.index = Math.min(Math.max(0, this.pages.length - 1), this.index + 1);
    this.emit("flip", { data: this.index });
  }

  destroy() {}
};
`;
const VIEWPORTS = [
  { label: "phone-portrait", width: 390, height: 844, mobile: true },
  { label: "phone-landscape", width: 844, height: 390, mobile: true },
  { label: "grid-670", width: 670, height: 900, mobile: false },
  { label: "grid-705", width: 705, height: 900, mobile: false },
  { label: "grid-770", width: 770, height: 900, mobile: false },
  { label: "grid-805", width: 805, height: 900, mobile: false },
  { label: "grid-835", width: 835, height: 900, mobile: false },
  { label: "tablet", width: 1024, height: 768, mobile: false },
  { label: "desktop", width: 1280, height: 800, mobile: false },
  { label: "wide", width: 1440, height: 900, mobile: false },
];


function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function routeExternalRuntimeFixtures(context) {
  await context.route(PAGE_FLIP_SRC, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/javascript; charset=utf-8",
      body: PAGE_FLIP_LIBRARY_FIXTURE,
    });
  });
}

function isSameOrigin(url) {
  try {
    return new URL(url).origin === BASE_URL;
  } catch {
    return false;
  }
}


async function revealProjectMedia(page) {
  return page.evaluate(() => {
    let count = 0;
    document.querySelectorAll(".project[hidden]").forEach((project) => {
      project.hidden = false;
      project.setAttribute("data-smoke-revealed", "");
      count += 1;
    });
    return count;
  });
}

async function scrollThroughPage(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForAnimationFrames(page);

  for (let step = 0; step < 90; step += 1) {
    const state = await page.evaluate(() => {
      const nextY = Math.min(
        window.scrollY + Math.max(window.innerHeight * 0.75, 280),
        document.documentElement.scrollHeight - window.innerHeight,
      );
      window.scrollTo(0, nextY);
      return {
        y: window.scrollY,
        maxY: document.documentElement.scrollHeight - window.innerHeight,
      };
    });
    await waitForAnimationFrames(page);
    if (state.y >= state.maxY - 2) break;
  }

  // Media readiness is checked below through decode/metadata, not network silence.
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitForAnimationFrames(page);
}

async function verifyPageShell(page, label) {
  const state = await page.evaluate(() => {
    const body = document.body;
    const bodyRect = body?.getBoundingClientRect();
    const visibleMedia = [...document.querySelectorAll("img, video, canvas")].filter((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    }).length;

    return {
      title: document.title,
      textLength: body?.innerText?.replace(/\s+/g, " ").trim().length ?? 0,
      bodyHeight: bodyRect?.height ?? 0,
      visibleMedia,
    };
  });

  assert(state.bodyHeight > 100, `${label}: page body is effectively blank`);
  assert(
    state.textLength > 20 || state.visibleMedia > 0,
    `${label}: page has no meaningful visible text or media`,
  );
}

async function verifyNoDocumentOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const allowed = 1;
    const viewportWidth = root.clientWidth;
    const documentOverflow = root.scrollWidth - viewportWidth;

    const offenders = [...document.body.querySelectorAll("*")]
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        if (style.display === "none" || style.visibility === "hidden") return null;
        if (rect.width <= 1 || rect.height <= 1) return null;
        if (style.position === "fixed") return null;
        if (rect.right <= viewportWidth + allowed && rect.left >= -allowed) return null;
        return {
          tag: node.tagName.toLowerCase(),
          className: typeof node.className === "string" ? node.className : "",
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      })
      .filter(Boolean)
      .slice(0, 12);

    return {
      viewportWidth,
      scrollWidth: root.scrollWidth,
      documentOverflow,
      offenders,
    };
  });

  assert(
    overflow.documentOverflow <= 1,
    `${label}: horizontal document overflow ${overflow.documentOverflow}px\n${JSON.stringify(overflow, null, 2)}`,
  );
}

async function verifyImages(page, label) {
  const failures = await page.evaluate(async () => {
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1 && rect.height > 1;
    };

    const images = [...document.images].filter((image) => image.currentSrc || image.src).filter(visible);

    await Promise.all(
      images.map((image) => {
        if (image.complete) return null;
        image.loading = "eager";
        return new Promise((resolve) => {
          const done = () => {
            image.removeEventListener("load", done);
            image.removeEventListener("error", done);
            clearTimeout(timer);
            resolve(null);
          };
          const timer = setTimeout(done, 8_000);
          image.addEventListener("load", done, { once: true });
          image.addEventListener("error", done, { once: true });
        });
      }),
    );

    const results = [];
    for (const image of images) {
      if (!image.complete || image.naturalWidth < 1 || image.naturalHeight < 1) {
        results.push(`${image.currentSrc || image.src} (${image.naturalWidth}x${image.naturalHeight})`);
        continue;
      }

      try {
        await image.decode();
      } catch {
        results.push(`${image.currentSrc || image.src} (decode failed)`);
      }
    }

    return results;
  });

  assert(!failures.length, `${label}: image decode failures:\n${failures.slice(0, 20).join("\n")}`);
}

async function verifyVideos(page, label) {
  const failures = await page.evaluate(async () => {
    const videos = [...document.querySelectorAll("video")].filter((video) => video.currentSrc || video.src);

    const results = await Promise.all(
      videos.map(
        (video) =>
          new Promise((resolve) => {
            const src = video.currentSrc || video.src;
            if (video.error) return resolve(`${video.error.code} ${src}`);
            if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0 && video.videoHeight > 0) {
              return resolve(null);
            }

            const done = (value) => {
              video.removeEventListener("loadedmetadata", ok);
              video.removeEventListener("error", fail);
              clearTimeout(timer);
              resolve(value);
            };
            const ok = () => done(video.videoWidth > 0 && video.videoHeight > 0 ? null : `zero metadata ${src}`);
            const fail = () => done(`${video.error?.code ?? "error"} ${src}`);
            const timer = setTimeout(() => done(`timeout ${src}`), 12_000);

            video.addEventListener("loadedmetadata", ok, { once: true });
            video.addEventListener("error", fail, { once: true });
            video.preload = "metadata";
            video.load();
          }),
      ),
    );

    return results.filter(Boolean);
  });

  assert(!failures.length, `${label}: video metadata failures:\n${failures.join("\n")}`);
}

async function verifyCanvasHosts(page, label) {
  const failures = await page.evaluate(() => {
    return [...document.querySelectorAll("[data-animated-canvas-gallery]")]
      .map((node, index) => {
        const canvas = node.querySelector("canvas");
        const rect = canvas?.getBoundingClientRect();
        const state = node.getAttribute("data-gallery-state");
        if (state === "error") return `canvas ${index}: gallery state is error`;
        if (!canvas || !rect || rect.width <= 2 || rect.height <= 2) return `canvas ${index}: missing or zero CSS size`;
        if (canvas.width <= 2 || canvas.height <= 2) return `canvas ${index}: zero bitmap size`;
        return null;
      })
      .filter(Boolean);
  });

  assert(!failures.length, `${label}: canvas failures:\n${failures.join("\n")}`);
}

async function closeLightbox(page) {
  const close = page.locator("[data-lightbox-close], .pswp__button--close").first();
  if (await close.count()) {
    await close.click({ force: true });
    await waitForLightboxClosed(page);
  }
}

async function lightboxState(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector("[data-media-lightbox]");
    const pswp = document.querySelector(".pswp");
    const open = (dialog instanceof HTMLDialogElement && dialog.open) || pswp instanceof HTMLElement;
    const image = document.querySelector("[data-lightbox-image]");
    const video = document.querySelector("[data-lightbox-video]");
    const caption = document.querySelector("[data-lightbox-caption]");
    const prev = document.querySelector("[data-lightbox-prev]");
    const next = document.querySelector("[data-lightbox-next]");

    if (pswp instanceof HTMLElement) {
      const activeSlide =
        pswp.querySelector('.pswp__item[aria-hidden="false"]') ||
        pswp.querySelector(".pswp__item");
      const pswpImage = activeSlide?.querySelector("img.pswp__img");
      const pswpVideo = activeSlide?.querySelector("[data-photoswipe-video]");
      const pswpCaption = pswp.querySelector(".media-lightbox__caption");
      const pswpPrev = pswp.querySelector(".pswp__button--arrow--prev");
      const pswpNext = pswp.querySelector(".pswp__button--arrow--next");

      return {
        open,
        imageHidden: !(pswpImage instanceof HTMLImageElement),
        imageSrc: pswpImage instanceof HTMLImageElement ? pswpImage.currentSrc || pswpImage.src || "" : "",
        videoHidden: !(pswpVideo instanceof HTMLVideoElement),
        videoSrc:
          pswpVideo instanceof HTMLVideoElement
            ? pswpVideo.currentSrc || pswpVideo.src || pswpVideo.querySelector("source[src]")?.getAttribute("src") || ""
            : "",
        videoPoster: pswpVideo instanceof HTMLVideoElement ? pswpVideo.poster || "" : "",
        videoAttributeSrc: pswpVideo instanceof HTMLVideoElement ? pswpVideo.getAttribute("src") || "" : "",
        videoControls: pswpVideo instanceof HTMLVideoElement ? pswpVideo.controls : false,
        videoMuted: pswpVideo instanceof HTMLVideoElement ? pswpVideo.muted : null,
        videoPaused: pswpVideo instanceof HTMLVideoElement ? pswpVideo.paused : true,
        videoCurrentTime: pswpVideo instanceof HTMLVideoElement ? pswpVideo.currentTime : 0,
        captionText: pswpCaption instanceof HTMLElement ? pswpCaption.textContent?.replace(/\s+/g, " ").trim() || "" : "",
        prevDisabled: pswpPrev instanceof HTMLButtonElement ? pswpPrev.disabled : null,
        nextDisabled: pswpNext instanceof HTMLButtonElement ? pswpNext.disabled : null,
        pswpIndex: window.pswp?.currIndex ?? null,
        pswpPotentialIndex: window.pswp?.potentialIndex ?? null,
        pswpMainScrollX: window.pswp?.mainScroll?.x ?? null,
        pswpCurrentSlideX: window.pswp?.mainScroll?.getCurrSlideX?.() ?? null,
        pswpCanSwipe: window.pswp?.mainScroll?.canBeSwiped?.() ?? null,
        pswpAllowPanToNext: window.pswp?.options?.allowPanToNext ?? null,
        pswpIsPannable: window.pswp?.currSlide?.isPannable?.() ?? null,
        pswpDragAxis: window.pswp?.gestures?.dragAxis ?? null,
      };
    }

    return {
      open,
      imageHidden: image instanceof HTMLImageElement ? image.hidden : true,
      imageSrc: image instanceof HTMLImageElement ? image.currentSrc || image.src || "" : "",
      videoHidden: video instanceof HTMLVideoElement ? video.hidden : true,
      videoSrc:
        video instanceof HTMLVideoElement
          ? video.currentSrc || video.src || video.querySelector("source[src]")?.getAttribute("src") || ""
          : "",
      videoPoster: video instanceof HTMLVideoElement ? video.poster || "" : "",
      videoAttributeSrc: video instanceof HTMLVideoElement ? video.getAttribute("src") || "" : "",
      videoControls: video instanceof HTMLVideoElement ? video.controls : false,
      videoMuted: video instanceof HTMLVideoElement ? video.muted : null,
      videoPaused: video instanceof HTMLVideoElement ? video.paused : true,
      videoCurrentTime: video instanceof HTMLVideoElement ? video.currentTime : 0,
      captionText: caption instanceof HTMLElement ? caption.textContent?.replace(/\s+/g, " ").trim() || "" : "",
      prevDisabled: prev instanceof HTMLButtonElement ? prev.disabled : null,
      nextDisabled: next instanceof HTMLButtonElement ? next.disabled : null,
    };
  });
}

async function assertLightboxOpen(page, label) {
  const state = await lightboxState(page);
  assert(state.open, `${label}: lightbox did not open\n${JSON.stringify(state, null, 2)}`);
  return state;
}

async function assertLightboxClosed(page, label) {
  const state = await lightboxState(page);
  assert(!state.open, `${label}: lightbox did not close\n${JSON.stringify(state, null, 2)}`);
  return state;
}

async function openSource(page, selector, label, method = "click") {
  const source = page.locator(selector).first();
  assert(await source.count(), `${label}: no lightbox source found for ${selector}`);
  await source.scrollIntoViewIfNeeded();

  if (method === "enter" || method === "space") {
    await source.focus();
    await page.keyboard.press(method === "enter" ? "Enter" : "Space");
  } else {
    await source.click({ force: true });
  }

  await page
    .waitForFunction(
      () => {
        const dialog = document.querySelector("[data-media-lightbox]");
        if (dialog instanceof HTMLDialogElement && dialog.open) return true;
        return Boolean(document.querySelector(".pswp"));
      },
      null,
      { timeout: 2_500 },
    )
    .catch(() => {});
  return assertLightboxOpen(page, label);
}

async function selectLightboxCandidate(page, selector, attributeName) {
  return page.evaluate(
    ({ selector: selectorValue, attribute }) => {
      document.querySelectorAll(`[${attribute}]`).forEach((node) => {
        node.removeAttribute(attribute);
      });

      const source = [...document.querySelectorAll(selectorValue)].find((candidate) => {
        if (!(candidate instanceof HTMLElement)) return false;
        if (candidate.closest("[hidden]")) return false;
        const rect = candidate.getBoundingClientRect();
        return rect.width > 1 && rect.height > 1;
      });

      if (!(source instanceof HTMLElement)) return false;

      source.setAttribute(attribute, "");
      return true;
    },
    { selector, attribute: attributeName },
  );
}

async function verifyLightboxKeyboardAndFocus(page, label) {
  const found = await selectLightboxCandidate(page, "[data-lightbox-source]", "data-smoke-lightbox-keyboard");
  if (!found) return;

  await openSource(page, "[data-smoke-lightbox-keyboard]", `${label}: Enter key opens lightbox`, "enter");
  await page.keyboard.press("Escape");
  await waitForLightboxClosed(page);
  await assertLightboxClosed(page, `${label}: Escape closes lightbox`);

  const focusRestored = await page.evaluate(() => document.activeElement?.hasAttribute("data-smoke-lightbox-keyboard") === true);
  assert(focusRestored, `${label}: focus was not restored to the source after Escape`);

  await openSource(page, "[data-smoke-lightbox-keyboard]", `${label}: Space key opens lightbox`, "space");
  await closeLightbox(page);
  await assertLightboxClosed(page, `${label}: close button closes keyboard-opened lightbox`);
}

async function selectNavigationCandidate(page) {
  return page.evaluate(() => {
    const mediaFor = (source) =>
      source.querySelector("[data-slide][data-active] img, [data-slide][data-active] video, img, video");
    const mediaUrl = (media) => {
      if (media instanceof HTMLImageElement) return media.currentSrc || media.src || "";
      if (media instanceof HTMLVideoElement) {
        return media.currentSrc || media.src || media.querySelector("source[src]")?.getAttribute("src") || "";
      }
      return "";
    };

    document.querySelectorAll("[data-smoke-lightbox-navigation]").forEach((node) => {
      node.removeAttribute("data-smoke-lightbox-navigation");
    });

    const projects = [...document.querySelectorAll(".project")].filter((project) => !project.closest("[hidden]"));

    for (const project of projects) {
      const sources = [...project.querySelectorAll("[data-lightbox-source]")]
        .filter((source) => source instanceof HTMLElement)
        .filter((source) => {
          const media = mediaFor(source);
          return media instanceof HTMLImageElement && Boolean(mediaUrl(media));
        });

      const urls = sources.map((source) => mediaUrl(mediaFor(source)));
      const uniqueUrls = [...new Set(urls)];

      if (uniqueUrls.length < 2) continue;

      sources[0].setAttribute("data-smoke-lightbox-navigation", "");

      return {
        first: uniqueUrls[0],
        second: uniqueUrls[1],
        last: uniqueUrls.at(-1),
      };
    }

    return null;
  });
}

async function verifyLightboxNavigationAndTouch(page, label, { touch = false } = {}) {
  const candidate = await selectNavigationCandidate(page);
  if (!candidate) return;

  await openSource(page, "[data-smoke-lightbox-navigation]", `${label}: navigation source opens`);
  let state = await lightboxState(page);
  assert(state.imageSrc === candidate.first, `${label}: first project image did not open\n${JSON.stringify({ candidate, state }, null, 2)}`);

  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(120);
  state = await lightboxState(page);
  assert(state.imageSrc === candidate.second, `${label}: ArrowRight did not move to the next project image\n${JSON.stringify({ candidate, state }, null, 2)}`);

  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(120);
  state = await lightboxState(page);
  assert(state.imageSrc === candidate.first, `${label}: ArrowLeft did not return to the first project image\n${JSON.stringify({ candidate, state }, null, 2)}`);

  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(120);
  state = await lightboxState(page);
  assert(state.imageSrc === candidate.last, `${label}: ArrowLeft did not wrap from first to last\n${JSON.stringify({ candidate, state }, null, 2)}`);

  if (touch) {
    await closeLightbox(page);
    await openSource(page, "[data-smoke-lightbox-navigation]", `${label}: touch source opens`);
    await page
      .waitForFunction(() => window.pswp?.opener?.isOpen === true, null, { timeout: 2_000 })
      .catch(() => {});
    const swipe = await page.evaluate(() => {
      const rect = document.querySelector(".pswp__scroll-wrap")?.getBoundingClientRect();
      if (!rect) {
        return { startX: 320, endX: 110, y: 220 };
      }

      return {
        startX: Math.round(rect.left + rect.width * 0.92),
        endX: Math.round(rect.left + rect.width * 0.02),
        y: Math.round(rect.top + rect.height * 0.5),
      };
    });
    const client = await page.context().newCDPSession(page);
    try {
      await client.send("Input.synthesizeScrollGesture", {
        x: swipe.startX,
        y: swipe.y,
        xDistance: swipe.endX - swipe.startX,
        yDistance: 0,
        gestureSourceType: "touch",
        speed: 800,
      });
    } finally {
      await client.detach().catch(() => {});
    }
    await page.waitForTimeout(700);
    state = await lightboxState(page);
    assert(state.imageSrc === candidate.second, `${label}: touch swipe did not move to the next project image\n${JSON.stringify({ candidate, state }, null, 2)}`);
  }

  await closeLightbox(page);
}

async function verifyLightboxBackdropClose(page, label) {
  const found = await selectLightboxCandidate(page, "[data-lightbox-source]", "data-smoke-lightbox-backdrop");
  if (!found) return;

  await openSource(page, "[data-smoke-lightbox-backdrop]", `${label}: backdrop source opens`);
  const photoSwipeBackdrop = page.locator(".pswp__bg").first();
  if (await photoSwipeBackdrop.count()) {
    await photoSwipeBackdrop.click({ position: { x: 10, y: 10 }, force: true });
  } else {
    await page.evaluate(() => {
      const dialog = document.querySelector("[data-media-lightbox]");
      dialog?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  }
  await waitForLightboxClosed(page);
  await assertLightboxClosed(page, `${label}: backdrop click closes lightbox`);
}

async function verifyLightboxSupplementalCaption(page, label) {
  const expected = await page.evaluate(() => {
    document.querySelectorAll("[data-smoke-lightbox-supplemental]").forEach((node) => {
      node.removeAttribute("data-smoke-lightbox-supplemental");
    });

    const copy = [...document.querySelectorAll("[data-lightbox-caption-copy]")]
      .find((node) => node instanceof HTMLElement && !node.closest("[hidden]"));
    const figure = copy?.closest("figure");
    const source = figure?.querySelector("[data-lightbox-source]");

    if (!(copy instanceof HTMLElement) || !(source instanceof HTMLElement)) return "";

    source.setAttribute("data-smoke-lightbox-supplemental", "");
    return copy.textContent?.replace(/\s+/g, " ").trim() || "";
  });

  if (!expected) return;

  const state = await openSource(page, "[data-smoke-lightbox-supplemental]", `${label}: supplemental caption source opens`);
  assert(
    state.captionText.includes(expected),
    `${label}: supplemental caption was not appended to lightbox caption\n${JSON.stringify({ expected, state }, null, 2)}`,
  );
  await closeLightbox(page);
}

async function verifyLightboxActiveDeckSlide(page, label) {
  const expected = await page.evaluate(() => {
    const mediaFor = (source) =>
      source.querySelector("[data-slide][data-active] img, [data-slide][data-active] video, img, video");
    const mediaUrl = (media) => {
      if (media instanceof HTMLImageElement) return media.currentSrc || media.src || "";
      if (media instanceof HTMLVideoElement) {
        return media.currentSrc || media.src || media.querySelector("source[src]")?.getAttribute("src") || "";
      }
      return "";
    };

    document.querySelectorAll("[data-smoke-lightbox-deck]").forEach((node) => {
      node.removeAttribute("data-smoke-lightbox-deck");
    });

    const deck = [...document.querySelectorAll("[data-media-deck]")]
      .find((candidate) => {
        if (!(candidate instanceof HTMLElement) || candidate.closest("[hidden]")) return false;
        return Boolean(candidate.querySelector("[data-lightbox-source]") && candidate.querySelector("[data-deck-next]"));
      });

    const source = deck?.querySelector("[data-lightbox-source]");
    const next = deck?.querySelector("[data-deck-next]");

    if (!(deck instanceof HTMLElement) || !(source instanceof HTMLElement) || !(next instanceof HTMLButtonElement)) {
      return null;
    }

    deck.scrollIntoView({ block: "center" });
    return true;
  });

  if (!expected) return;

  await page.locator("[data-media-deck]:has([data-lightbox-source]):has([data-deck-next])").first().scrollIntoViewIfNeeded();
  await page.locator("[data-media-deck]:has([data-lightbox-source]):has([data-deck-next]) [data-deck-next]").first().click({ force: true });
  await page.waitForTimeout(300);

  const active = await page.evaluate(() => {
    const mediaFor = (source) =>
      source.querySelector("[data-slide][data-active] img, [data-slide][data-active] video, img, video");
    const mediaUrl = (media) => {
      if (media instanceof HTMLImageElement) return media.currentSrc || media.src || "";
      if (media instanceof HTMLVideoElement) {
        return media.currentSrc || media.src || media.querySelector("source[src]")?.getAttribute("src") || "";
      }
      return "";
    };

    const deck = [...document.querySelectorAll("[data-media-deck]")]
      .find((candidate) => {
        if (!(candidate instanceof HTMLElement) || candidate.closest("[hidden]")) return false;
        return Boolean(candidate.querySelector("[data-lightbox-source]") && candidate.querySelector("[data-deck-next]"));
      });
    const source = deck?.querySelector("[data-lightbox-source]");
    const caption = deck?.querySelector("[data-slide-caption][data-active]");

    if (!(source instanceof HTMLElement)) return null;

    source.setAttribute("data-smoke-lightbox-deck", "");

    return {
      url: mediaUrl(mediaFor(source)),
      caption: caption instanceof HTMLElement ? caption.textContent?.replace(/\s+/g, " ").trim() || "" : "",
    };
  });

  if (!active?.url) return;

  const state = await openSource(page, "[data-smoke-lightbox-deck]", `${label}: active deck source opens`);
  assert(
    state.imageSrc === active.url || state.videoSrc === active.url,
    `${label}: active deck slide did not open in lightbox\n${JSON.stringify({ active, state }, null, 2)}`,
  );

  if (active.caption) {
    assert(
      state.captionText.includes(active.caption),
      `${label}: active deck caption did not open in lightbox\n${JSON.stringify({ active, state }, null, 2)}`,
    );
  }

  await closeLightbox(page);
}

async function verifyLightboxVideo(page, label) {
  const expected = await page.evaluate(async () => {
    const mediaFor = (source) =>
      source.querySelector("[data-slide][data-active] video, video");
    const mediaUrl = (media) =>
      media instanceof HTMLVideoElement
        ? media.currentSrc || media.src || media.querySelector("source[src]")?.getAttribute("src") || ""
        : "";

    document.querySelectorAll("[data-smoke-lightbox-video]").forEach((node) => {
      node.removeAttribute("data-smoke-lightbox-video");
    });

    const source = [...document.querySelectorAll("[data-lightbox-source]")]
      .find((candidate) => {
        if (!(candidate instanceof HTMLElement) || candidate.closest("[hidden]")) return false;
        return mediaFor(candidate) instanceof HTMLVideoElement;
      });

    if (!(source instanceof HTMLElement)) return null;

    const video = mediaFor(source);
    if (!(video instanceof HTMLVideoElement)) return null;

    source.setAttribute("data-smoke-lightbox-video", "");
    video.preload = "metadata";
    video.load();

    if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise((resolve) => {
        const done = () => {
          video.removeEventListener("loadedmetadata", done);
          video.removeEventListener("error", done);
          resolve(null);
        };

        video.addEventListener("loadedmetadata", done, { once: true });
        video.addEventListener("error", done, { once: true });
        setTimeout(done, 3000);
      });
    }

    const resumeAt = Number.isFinite(video.duration) && video.duration > 0.6 ? 0.25 : 0;

    try {
      video.currentTime = resumeAt;
    } catch {
      // Some browsers reject setting currentTime on media without seekable data.
    }

    return {
      src: mediaUrl(video),
      poster: video.poster || "",
      loop: video.loop,
      resumeAt,
    };
  });

  if (!expected?.src) return;

  let state = await openSource(page, "[data-smoke-lightbox-video]", `${label}: video source opens`);
  assert(state.videoSrc === expected.src, `${label}: lightbox video src did not match source video\n${JSON.stringify({ expected, state }, null, 2)}`);
  assert(state.videoControls, `${label}: lightbox video controls are not visible\n${JSON.stringify(state, null, 2)}`);
  assert(state.videoMuted === false, `${label}: lightbox video should be unmuted\n${JSON.stringify(state, null, 2)}`);
  assert(state.videoPoster === expected.poster, `${label}: lightbox video poster was not preserved\n${JSON.stringify({ expected, state }, null, 2)}`);
  assert(
    Math.abs(state.videoCurrentTime - expected.resumeAt) < 0.35,
    `${label}: lightbox video did not preserve currentTime approximately\n${JSON.stringify({ expected, state }, null, 2)}`,
  );

  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(160);
  state = await lightboxState(page);
  assert(
    state.videoHidden || state.videoSrc !== expected.src,
    `${label}: moving away from a video slide did not deactivate the lightbox video\n${JSON.stringify({ expected, state }, null, 2)}`,
  );

  await closeLightbox(page);
  state = await lightboxState(page);
  assert(
    state.videoPaused && state.videoHidden && !state.videoAttributeSrc,
    `${label}: closing lightbox did not pause and clear the video\n${JSON.stringify(state, null, 2)}`,
  );
}

async function verifyLightbox(page, label, { touch = false, advanced = false } = {}) {
  const source = page.locator("[data-lightbox-source]:visible").first();
  if (!(await source.count())) return;

  await openSource(page, "[data-lightbox-source]:visible", `${label}: click opens lightbox`);
  await closeLightbox(page);
  await assertLightboxClosed(page, `${label}: close button closes lightbox`);

  if (!advanced) {
    return;
  }

  await verifyLightboxKeyboardAndFocus(page, label);
  await verifyLightboxNavigationAndTouch(page, label, { touch });
  await verifyLightboxBackdropClose(page, label);
  await verifyLightboxSupplementalCaption(page, label);
  await verifyLightboxActiveDeckSlide(page, label);
  await verifyLightboxVideo(page, label);
}

async function verifyNoVisibleRevealTargetsHidden(page, label) {
  const offenders = await page.evaluate(() => {
    const isInViewport = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const viewport = document.documentElement;

      return (
        !node.closest("[hidden]") &&
        style.display !== "none" &&
        rect.width > 1 &&
        rect.height > 1 &&
        rect.bottom > 0 &&
        rect.top < viewport.clientHeight &&
        rect.right > 0 &&
        rect.left < viewport.clientWidth
      );
    };

    return [...document.querySelectorAll("[data-reveal]")]
      .filter((node) => {
        if (!isInViewport(node)) return false;
        const style = getComputedStyle(node);
        return style.visibility === "hidden" || Number(style.opacity) < 0.05;
      })
      .map((node) => ({
        tag: node.tagName.toLowerCase(),
        className: typeof node.className === "string" ? node.className : "",
        reveal: node.getAttribute("data-reveal"),
      }))
      .slice(0, 12);
  });

  assert(!offenders.length, `${label}: visible reveal targets are hidden\n${JSON.stringify(offenders, null, 2)}`);
}

async function verifyMotionContract(page, label) {
  const report = await page.evaluate(() => {
    const count = (selector) => document.querySelectorAll(selector).length;
    const exists = (selector) => Boolean(document.querySelector(selector));
    const revealOwnerProblems = [];

    const ownerSelectors = [
      ["media deck", "[data-media-deck]"],
      ["mockup", ".mockup"],
      ["before/after", "[data-before-after]"],
      ["page flip", "[data-page-flip]"],
      ["animated canvas", "[data-animated-canvas-gallery]"],
      ["infinite reel", "[data-infinite-reel]"],
    ];

    for (const [name, selector] of ownerSelectors) {
      document.querySelectorAll(selector).forEach((node) => {
        if (node.hasAttribute("data-reveal") || node.querySelector("[data-reveal]")) {
          revealOwnerProblems.push(name);
        }
      });
    }

    const videoRevealOwners = [...document.querySelectorAll("video")]
      .filter((node) => node.closest("[data-reveal]"))
      .map((node) => node.closest("[data-reveal]")?.className || node.tagName)
      .slice(0, 12);

    const canvasRevealOwners = [...document.querySelectorAll("canvas")]
      .filter((node) => node.closest("[data-reveal]"))
      .map((node) => node.closest("[data-reveal]")?.className || node.tagName)
      .slice(0, 12);

    const coverage = {
      projectCards: count(".project-card[data-reveal=\"card\"]") >= 2,
      firstProjectRow: count(".project-card[data-reveal=\"card\"]") >= 2,
      secondProjectRow: count(".project-card[data-reveal=\"card\"]") >= 4,
      plainGrid: exists(".media-group[data-layout=\"grid\"]:not([data-overflow]):not([data-compact-layout]) > .media-group__items[data-reveal-group] > figure.media[data-reveal=\"media\"]"),
      longGrid: [...document.querySelectorAll(".media-group[data-layout=\"grid\"]:not([data-overflow]):not([data-compact-layout])")]
        .some((group) => group.querySelectorAll(":scope > .media-group__items > figure.media[data-reveal=\"media\"]").length >= 4),
      masonry: exists(".media-group[data-layout=\"masonry\"] > .media-group__items[data-reveal-group] > figure.media[data-reveal=\"media\"]"),
      editorial: !exists(".media-group[data-layout=\"editorial\"]") ||
        exists(".media-group[data-layout=\"editorial\"] > .media-group__items[data-reveal-group] > figure.media[data-reveal=\"media\"]"),
      bento: !exists(".media-group[data-layout=\"bento\"]") ||
        exists(".media-group[data-layout=\"bento\"] > .media-group__items[data-reveal-group][data-reveal-rail] > figure.media[data-reveal=\"media\"]"),
      sequence: exists(".media-group[data-layout=\"sequence\"] > .media-group__items[data-reveal-group] figure.media[data-reveal=\"media\"]"),
      compactReel: exists(".media-group[data-compact-layout=\"reel\"] > .media-group__items[data-reveal-group][data-reveal-rail]"),
      overflowReel: exists(".media-group[data-overflow=\"reel\"] > .media-group__items[data-reveal-rail]") &&
        count(".media-group[data-overflow=\"reel\"] > .media-group__items [data-reveal]") === 0,
      infiniteReel: exists("[data-infinite-reel]") &&
        count("[data-infinite-reel][data-reveal], [data-infinite-reel] [data-reveal]") === 0,
      justifiedGallery: exists(".justified-gallery__row[data-reveal-group][data-reveal-rail] > figure.media[data-reveal=\"media\"]"),
      video: count("video") > 0 && videoRevealOwners.length === 0,
      slider: exists("[data-media-deck]"),
      mockupDeck: exists(".mockup[data-media-deck]"),
      beforeAfter: exists("[data-before-after]"),
      canvas: exists("[data-animated-canvas-gallery]") && canvasRevealOwners.length === 0,
    };

    const invalidRevealKinds = [...document.querySelectorAll("[data-reveal]")]
      .map((node) => node.getAttribute("data-reveal"))
      .filter((value) => value !== "copy" && value !== "media" && value !== "card");

    return {
      coverage,
      invalidRevealKinds,
      revealOwnerProblems,
      videoRevealOwners,
      canvasRevealOwners,
      revealTargets: count("[data-reveal]"),
      revealGroups: count("[data-reveal-group]"),
      revealRails: count("[data-reveal-rail]"),
    };
  });

  const missingCoverage = Object.entries(report.coverage)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);

  assert(!missingCoverage.length, `${label}: missing motion coverage ${missingCoverage.join(", ")}\n${JSON.stringify(report, null, 2)}`);
  assert(!report.invalidRevealKinds.length, `${label}: invalid reveal kinds ${report.invalidRevealKinds.join(", ")}`);
  assert(!report.revealOwnerProblems.length, `${label}: interactive owners contain global reveal ${report.revealOwnerProblems.join(", ")}`);
  assert(!report.videoRevealOwners.length, `${label}: videos are inside reveal targets ${report.videoRevealOwners.join(", ")}`);
  assert(!report.canvasRevealOwners.length, `${label}: canvas is inside reveal targets ${report.canvasRevealOwners.join(", ")}`);

  return report;
}

async function verifyProjectCardRevealBatching(page, label) {
  const cardCount = await page.locator(".project-card[data-reveal=\"card\"]").count();
  if (cardCount < 4) return;

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);

  const initial = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".project-card[data-reveal=\"card\"]")];
    const last = cards.at(-1);
    if (!(last instanceof HTMLElement)) return null;
    const rect = last.getBoundingClientRect();
    const style = getComputedStyle(last);
    return {
      hidden: style.visibility === "hidden" || Number(style.opacity) < 0.05,
      belowViewport: rect.top >= document.documentElement.clientHeight,
      opacity: style.opacity,
      visibility: style.visibility,
      top: Math.round(rect.top),
    };
  });

  assert(initial?.hidden && initial.belowViewport, `${label}: final project card was not prepared below viewport\n${JSON.stringify(initial, null, 2)}`);

  await page.locator(".project-card[data-reveal=\"card\"]").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);

  const partial = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".project-card[data-reveal=\"card\"]")];
    const first = cards[0];
    const last = cards.at(-1);

    if (!(first instanceof HTMLElement) || !(last instanceof HTMLElement)) return null;

    const firstStyle = getComputedStyle(first);
    const lastStyle = getComputedStyle(last);
    const lastRect = last.getBoundingClientRect();

    return {
      firstVisible: firstStyle.visibility !== "hidden" && Number(firstStyle.opacity) > 0.95,
      lastStillHidden: lastStyle.visibility === "hidden" || Number(lastStyle.opacity) < 0.05,
      lastBelowViewport: lastRect.top >= document.documentElement.clientHeight,
      firstOpacity: firstStyle.opacity,
      lastOpacity: lastStyle.opacity,
      lastTop: Math.round(lastRect.top),
    };
  });

  assert(partial?.firstVisible, `${label}: first project card did not reveal\n${JSON.stringify(partial, null, 2)}`);
  assert(partial.lastStillHidden && partial.lastBelowViewport, `${label}: lower project cards completed before entering viewport\n${JSON.stringify(partial, null, 2)}`);

  await page.locator(".project-card[data-reveal=\"card\"]").last().scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);

  const final = await page.evaluate(() => {
    const card = [...document.querySelectorAll(".project-card[data-reveal=\"card\"]")].at(-1);
    if (!(card instanceof HTMLElement)) return null;
    const style = getComputedStyle(card);
    return {
      visible: style.visibility !== "hidden" && Number(style.opacity) > 0.95,
      opacity: style.opacity,
      visibility: style.visibility,
    };
  });

  assert(final?.visible, `${label}: final project card did not reveal after entering viewport\n${JSON.stringify(final, null, 2)}`);
}

async function verifyActiveRailRelease(page, label) {
  const railIndex = await page.evaluate(() => {
    const isActiveHorizontalRail = (rail) => {
      const styles = getComputedStyle(rail);
      const overflowAllowsScrolling = styles.overflowX === "auto" || styles.overflowX === "scroll";
      return overflowAllowsScrolling && rail.scrollWidth > rail.clientWidth + 2;
    };

    return [...document.querySelectorAll("[data-reveal-rail]")]
      .findIndex((rail) =>
        rail instanceof HTMLElement &&
        !rail.closest("[hidden]") &&
        rail.querySelector("[data-reveal]") &&
        isActiveHorizontalRail(rail),
      );
  });

  assert(railIndex >= 0, `${label}: no active horizontal reveal rail found`);

  await page.evaluate((index) => {
    const rail = [...document.querySelectorAll("[data-reveal-rail]")][index];
    rail?.scrollIntoView({ block: "center", inline: "start" });
  }, railIndex);
  await page.waitForTimeout(500);

  const state = await page.evaluate((index) => {
    const rail = [...document.querySelectorAll("[data-reveal-rail]")][index];
    if (!(rail instanceof HTMLElement)) return null;

    const targets = [...rail.querySelectorAll("[data-reveal]")].filter((node) => node instanceof HTMLElement);
    const hidden = targets
      .filter((node) => {
        const style = getComputedStyle(node);
        return style.visibility === "hidden" || Number(style.opacity) < 0.05;
      })
      .map((node) => ({
        className: typeof node.className === "string" ? node.className : "",
        reveal: node.getAttribute("data-reveal"),
      }));

    return {
      hidden,
      targetCount: targets.length,
      scrollWidth: rail.scrollWidth,
      clientWidth: rail.clientWidth,
      overflowX: getComputedStyle(rail).overflowX,
    };
  }, railIndex);

  assert(state && state.targetCount > 0, `${label}: active rail has no reveal targets\n${JSON.stringify(state, null, 2)}`);
  assert(!state.hidden.length, `${label}: active rail did not release all reveal targets\n${JSON.stringify(state, null, 2)}`);
}

async function collectDuplicateMediaLoads(page) {
  return page.evaluate(() => {
    const counts = new Map();
    performance
      .getEntriesByType("resource")
      .filter((entry) => /\/media\//.test(entry.name))
      .forEach((entry) => {
        counts.set(entry.name, (counts.get(entry.name) ?? 0) + 1);
      });

    return [...counts.entries()]
      .filter(([, count]) => count > 4)
      .map(([url, count]) => ({ url, count }))
      .slice(0, 10);
  });
}

async function auditViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.mobile,
    hasTouch: viewport.mobile,
    deviceScaleFactor: 1,
  });
  await routeExternalRuntimeFixtures(context);
  const page = await context.newPage();
  const errors = [];
  const warnings = [];
  const label = `${viewport.label} ${viewport.width}x${viewport.height}`;

  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText || "request failed";
    if (errorText === "net::ERR_ABORTED") return;
    if (!isSameOrigin(request.url())) {
      warnings.push(`external requestfailed: ${errorText} ${request.url()}`);
      return;
    }
    errors.push(`requestfailed: ${errorText} ${request.url()}`);
  });
  page.on("response", (response) => {
    const status = response.status();
    const request = response.request();
    const resourceType = request.resourceType();
    if (status < 400) return;
    if (!["document", "stylesheet", "script", "image", "media", "font"].includes(resourceType)) return;
    if (!isSameOrigin(response.url())) {
      warnings.push(`external response ${status}: ${resourceType} ${response.url()}`);
      return;
    }
    errors.push(`response ${status}: ${resourceType} ${response.url()}`);
  });
  page.on("console", (message) => {
    if (message.text().startsWith("Failed to load resource:")) return;
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    // Global reveals initialize on pageshow + RAF (src/motion.ts), not DOM ready.
    // Load is required here by that lifecycle; networkidle is not a readiness signal.
    await page.waitForLoadState("load", { timeout: 30_000 });
    await waitForDocumentReady(page);
    await verifyNoVisibleRevealTargetsHidden(page, label);
    const motionReport = await verifyMotionContract(page, label);

    if (viewport.label === "phone-portrait") {
      await verifyProjectCardRevealBatching(page, label);
      await verifyActiveRailRelease(page, label);
    }

    const revealed = await revealProjectMedia(page);
    await scrollThroughPage(page);
    await verifyNoVisibleRevealTargetsHidden(page, label);

    await verifyPageShell(page, label);
    await verifyNoDocumentOverflow(page, label);
    await verifyImages(page, label);
    await verifyVideos(page, label);
    await verifyCanvasHosts(page, label);
    await verifyLightbox(page, label, {
      touch: viewport.mobile,
      advanced: viewport.label === "phone-portrait" || viewport.label === "desktop",
    });

    const duplicateLoads = await collectDuplicateMediaLoads(page);
    if (duplicateLoads.length) {
      warnings.push(`${label}: duplicate media resource entries ${JSON.stringify(duplicateLoads)}`);
    }

    assert(!errors.length, `${label}: browser errors:\n${errors.join("\n")}`);
    console.log(`[smoke] ${label}: OK (${revealed} hidden projects revealed, ${motionReport.revealTargets} reveal targets, ${motionReport.revealRails} reveal rails)`);
    return warnings;
  } finally {
    await context.close();
  }
}

async function auditDeepReloadAndHistory(browser) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  await routeExternalRuntimeFixtures(context);
  const page = await context.newPage();

  try {
    await page.goto(`${BASE_URL}/#project-sensetique`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await verifyNoVisibleRevealTargetsHidden(page, "deep-reload #project-sensetique");

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.goto(`${BASE_URL}/#project-styx`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.goBack({ waitUntil: "domcontentloaded" });
    await verifyNoVisibleRevealTargetsHidden(page, "history Back");
    await page.goForward({ waitUntil: "domcontentloaded" });
    await verifyNoVisibleRevealTargetsHidden(page, "history Forward");

    await page.evaluate(() => {
      const event = new Event("pagehide");
      Object.defineProperty(event, "persisted", { value: true });
      window.dispatchEvent(event);
    });
    await verifyLightbox(page, "simulated BFCache pagehide");

    console.log("[smoke] navigation lifecycle: OK (deep reload, Back, Forward, persisted pagehide)");
  } finally {
    await context.close();
  }
}

async function auditReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  await routeExternalRuntimeFixtures(context);
  const page = await context.newPage();

  try {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.evaluate(() => document.fonts?.ready);
    await revealProjectMedia(page);
    await page.waitForTimeout(120);

    const hidden = await page.evaluate(() => {
      return [...document.querySelectorAll("[data-reveal]")]
        .filter((node) => {
          if (!(node instanceof HTMLElement) || node.closest("[hidden]")) return false;
          const style = getComputedStyle(node);
          return style.visibility === "hidden" || Number(style.opacity) < 0.05;
        })
        .map((node) => ({
          className: typeof node.className === "string" ? node.className : "",
          reveal: node.getAttribute("data-reveal"),
        }))
        .slice(0, 12);
    });

    assert(!hidden.length, `reduced-motion: reveal targets should stay immediately visible\n${JSON.stringify(hidden, null, 2)}`);
    console.log("[smoke] reduced-motion: OK (global reveal and hero ambient motion disabled)");
  } finally {
    await context.close();
  }
}

export async function runSmokeSite({ browser, baseUrl }) {
  BASE_URL = baseUrl;
  const allWarnings = [];

  for (const viewport of VIEWPORTS) {
    allWarnings.push(...(await auditViewport(browser, viewport)));
  }

  await auditDeepReloadAndHistory(browser);
  await auditReducedMotion(browser);

  allWarnings.forEach((warning) => console.warn(`[smoke] warning: ${warning}`));
  console.log(`Browser smoke OK: ${VIEWPORTS.length} viewports, motion contract, reveal batching, rail release, navigation lifecycle, reduced motion, media decode, video metadata, canvas health, lightbox, overflow`);
}

if (isDirectExecution(import.meta.url)) {
  await withE2ERuntime(({ browser, baseUrl }) => runSmokeSite({ browser, baseUrl }));
}
