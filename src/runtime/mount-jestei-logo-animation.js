const ANIMATION_URL = "/assets/jestei/branding/jestei-logo-anatomy-animation.html";
const POSTER_URL = "/assets/media/cases/jesteipool/01-logo/02/01.webp";
const TARGET_SLIDE_SELECTOR = `.jestei-logo__slide[href="${POSTER_URL}"]`;

function createAnimationCard(documentRef) {
  const card = documentRef.createElement("figure");
  card.className = "jestei-logo__animation-card";
  card.setAttribute("data-jestei-logo-animation", "");
  card.setAttribute("aria-label", "анимация построения логотипа Jestei Pool");

  const poster = documentRef.createElement("img");
  poster.className = "jestei-logo__animation-poster";
  poster.src = POSTER_URL;
  poster.alt = "Устройство и построение логотипа Jestei Pool в деталях";
  poster.decoding = "async";

  const frame = documentRef.createElement("iframe");
  frame.className = "jestei-logo__animation-frame";
  frame.src = ANIMATION_URL;
  frame.title = "Анимация построения логотипа Jestei Pool";
  frame.loading = "lazy";
  frame.setAttribute("scrolling", "no");
  frame.setAttribute("aria-hidden", "true");

  card.append(poster, frame);
  return card;
}

export function mountJesteiLogoAnimation(root = document) {
  const composition = root.querySelector("#jestei-logo [data-jestei-logo-composition]");
  const slider = composition?.querySelector("[data-jestei-logo-slider]");
  if (!(composition instanceof HTMLElement) || !(slider instanceof HTMLElement)) return;
  if (composition.querySelector("[data-jestei-logo-animation]")) return;

  const removedSlide = slider.querySelector(TARGET_SLIDE_SELECTOR);
  removedSlide?.remove();

  const card = createAnimationCard(root.ownerDocument || root);
  slider.before(card);

  const handleReady = (event) => {
    if (event.origin !== window.location.origin) return;
    if (event.data?.type !== "jestei-logo-animation-ready") return;
    if (event.source !== card.querySelector("iframe")?.contentWindow) return;
    card.classList.add("is-ready");
  };

  window.addEventListener("message", handleReady);

  return () => {
    window.removeEventListener("message", handleReady);
    card.remove();
  };
}
