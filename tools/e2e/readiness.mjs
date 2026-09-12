const READINESS_TIMEOUT_MS = 10_000;
const MEDIA_METADATA_TIMEOUT_MS = 8_000;

export async function waitForAnimationFrames(page, count = 2) {
  if (!Number.isInteger(count) || count < 1) throw new Error(`invalid animation frame count: ${count}`);

  await page.evaluate(({ frames, timeoutMs }) => new Promise((resolve, reject) => {
    let remaining = frames;
    const timeout = window.setTimeout(() => {
      reject(new Error(`animation frame readiness timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearTimeout(timeout);
        resolve(null);
        return;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }), { frames: count, timeoutMs: READINESS_TIMEOUT_MS });
}

export async function waitForDocumentReady(page, selector = "main") {
  await page.locator(selector).first().waitFor({
    state: "attached",
    timeout: READINESS_TIMEOUT_MS,
  });
  await page.waitForFunction(
    () => document.fonts.status === "loaded",
    undefined,
    { timeout: READINESS_TIMEOUT_MS },
  );
  await waitForAnimationFrames(page);
}

export async function waitForLightboxOpen(page) {
  await page.waitForFunction(() => {
    const dialog = document.querySelector("[data-media-lightbox]");
    return Boolean(document.querySelector(".pswp")) || (dialog instanceof HTMLDialogElement && dialog.open);
  }, undefined, { timeout: READINESS_TIMEOUT_MS });

  await page.evaluate(async (timeoutMs) => {
    const pswp = document.querySelector(".pswp");
    if (!(pswp instanceof HTMLElement)) return;

    const activeSlide =
      pswp.querySelector('.pswp__item[aria-hidden="false"]') ||
      pswp.querySelector(".pswp__item");
    const video = activeSlide?.querySelector("[data-photoswipe-video]");

    if (!(video instanceof HTMLVideoElement)) return;
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return;

    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error(`lightbox video metadata timed out after ${timeoutMs} ms`));
      }, timeoutMs);

      const cleanup = () => {
        window.clearTimeout(timeout);
        video.removeEventListener("loadedmetadata", done);
        video.removeEventListener("error", done);
      };

      const done = () => {
        cleanup();
        resolve(null);
      };

      video.addEventListener("loadedmetadata", done, { once: true });
      video.addEventListener("error", done, { once: true });
    });
  }, MEDIA_METADATA_TIMEOUT_MS);

  await waitForAnimationFrames(page, 1);
}

export async function waitForLightboxClosed(page) {
  await page.waitForFunction(
    () => !document.querySelector(".pswp") && !document.querySelector("[data-media-lightbox][open]"),
    undefined,
    { timeout: READINESS_TIMEOUT_MS },
  );
}
