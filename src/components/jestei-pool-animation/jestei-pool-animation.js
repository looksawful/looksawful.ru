const FRAME_INTERVAL_MS = 100;
const FRAME_SELECTOR = "[data-jestei-pool-animation-frame]";

const FRAME_SOURCES = [
  "J-02.png",
  "J-03.png",
  "e-04.png",
  "e-05.png",
  "s-06.png",
  "s-07.png",
  "t-08.png",
  "t-09.png",
  "e1-10.png",
  "e1-11.png",
  "i-12.png",
  "i-13.png",
  "P-14.png",
  "P-15.png",
  "o1-16.png",
  "o1-17.png",
  "o2-18.png",
  "o2-19.png",
  "l-20.png",
  "l-21.png",
].map((filename) => new URL(`../../assets/jesteipool-animations/${filename}`, import.meta.url).href);

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "sync";
    image.onload = async () => {
      try {
        if (typeof image.decode === "function") {
          await image.decode();
        }
      } catch {
        // decode может падать в некоторых браузерах — не блокируем анимацию
      }
      resolve(image);
    };
    image.onerror = reject;
    image.src = source;
  });
}

async function preloadFrames() {
  return Promise.all(FRAME_SOURCES.map(loadImage));
}

function applyFrameStyles(image) {
  image.className = "jestei-pool-animation__frame";
  image.alt = "";
  image.decoding = "sync";
  image.setAttribute("aria-hidden", "true");

  image.style.position = "absolute";
  image.style.inset = "0";
  image.style.inlineSize = "100%";
  image.style.blockSize = "100%";
  image.style.objectFit = "cover";
  image.style.opacity = "0";
  image.style.visibility = "hidden";
  image.style.pointerEvents = "none";
}

export async function initJesteiPoolAnimation() {
  const frame = document.querySelector(FRAME_SELECTOR);

  if (!(frame instanceof HTMLImageElement)) {
    return;
  }

  const container = frame.parentElement;
  if (!container) {
    return;
  }

  if (container.dataset.jesteiPoolAnimationMounted === "true") {
    return;
  }

  container.dataset.jesteiPoolAnimationMounted = "true";

  const computedPosition = window.getComputedStyle(container).position;
  if (computedPosition === "static") {
    container.style.position = "relative";
  }

  const frames = await preloadFrames();
  if (!frames.length) {
    return;
  }

  const bufferA = frame;
  const bufferB = frame.cloneNode(false);

  applyFrameStyles(bufferA);
  applyFrameStyles(bufferB);

  container.append(bufferB);

  let visibleBuffer = bufferA;
  let hiddenBuffer = bufferB;
  let frameIndex = 0;

  visibleBuffer.src = frames[frameIndex].src;
  visibleBuffer.style.opacity = "1";
  visibleBuffer.style.visibility = "visible";

  async function showNextFrame() {
    frameIndex = (frameIndex + 1) % frames.length;
    const nextFrame = frames[frameIndex];

    hiddenBuffer.src = nextFrame.src;

    try {
      if (typeof hiddenBuffer.decode === "function") {
        await hiddenBuffer.decode();
      }
    } catch {
      // не роняем цикл, если decode недоступен/ломается
    }

    hiddenBuffer.style.visibility = "visible";
    hiddenBuffer.style.opacity = "1";

    visibleBuffer.style.opacity = "0";
    visibleBuffer.style.visibility = "hidden";

    [visibleBuffer, hiddenBuffer] = [hiddenBuffer, visibleBuffer];

    window.setTimeout(showNextFrame, FRAME_INTERVAL_MS);
  }

  window.setTimeout(showNextFrame, FRAME_INTERVAL_MS);
}
