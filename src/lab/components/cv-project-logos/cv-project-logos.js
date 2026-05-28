const CANVAS_SIZE = 48;
const CIRCLE_RADIUS = CANVAS_SIZE * 0.5;

const drawLogoPlaceholder = (canvas) => {
  if (!(canvas instanceof HTMLCanvasElement)) {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const dpr = Math.max(1, globalThis.devicePixelRatio || 1);

  canvas.width = Math.round(CANVAS_SIZE * dpr);
  canvas.height = Math.round(CANVAS_SIZE * dpr);
  canvas.style.inlineSize = `${CANVAS_SIZE}px`;
  canvas.style.blockSize = `${CANVAS_SIZE}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.beginPath();
  ctx.arc(CANVAS_SIZE * 0.5, CANVAS_SIZE * 0.5, CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#000";
  ctx.fill();
}

export const mountCvProjectLogos = (selector = "[data-cv-project-logo]") => {
  const canvases = [...document.querySelectorAll(selector)];

  if (!canvases.length) {
    return;
  }

  canvases.forEach((canvas) => {
    drawLogoPlaceholder(canvas);
  });
};