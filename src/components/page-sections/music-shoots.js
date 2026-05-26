import { joinMarkup, projectAsset, styleVars } from "./shared.js";

const formatSlideNumber = (index) => String(index + 1).padStart(2, "0");
const createSeries = (series, length) =>
  Array.from({ length }, (_, index) => projectAsset(`music-shoots/${series}/shot-${formatSlideNumber(index)}.jpg`));

const PROJECTS = [
  {
    title: "Съешь ещё этих мягких булок",
    years: "2022 - 2025",
    linkLabel: "пыльный флажок",
    counter: "1 / 10",
    counterPosition: "top",
    sliderRatio: "1.34 / 1",
    sliderMax: "760px",
    innerOffset: "4px",
    images: createSeries("series-01", 10),
  },
  {
    title: "Мягкие французские булки",
    years: "2023 – 2025",
    linkLabel: "рыхлый экран",
    sliderRatio: "1.78 / 1",
    sliderMax: "820px",
    images: createSeries("series-02", 5),
  },
  {
    title: "Ещё этих мягких французских булок",
    years: "2023 – 2025",
    linkLabel: "кривой воздух",
    counter: "2 / 10",
    counterPosition: "bottom",
    sliderRatio: "1.78 / 1",
    sliderMax: "820px",
    images: createSeries("series-03", 10),
  },
  {
    title: "Булки мягкие съешь ещё",
    years: "2024 – 2025",
    linkLabel: "тихий прямоугольник",
    counter: "1 / 3",
    counterPosition: "bottom",
    sliderRatio: "1 / 1",
    sliderMax: "760px",
    mainMin: "520px",
    images: createSeries("series-04", 3),
  },
];

const renderCounter = ({ counter, counterPosition }) =>
  counter ? `<div class="music-shoots__counter music-shoots__counter--${counterPosition}">${counter}</div>` : "";

const renderSlides = (images) =>
  joinMarkup(
    images,
    (image, index) =>
      `<div class="music-shoots__slide" data-image-number="${formatSlideNumber(index)}" style="--image: url('${image}')"></div>`,
  );

const renderNav = (images, title) => `
  <div class="music-shoots__nav" aria-label="Слайды">
    ${joinMarkup(
      images,
      (_, index) =>
        `<button class="music-shoots__nav-button" type="button" data-slide-index="${index}" aria-label="Показать слайд ${formatSlideNumber(index)} для проекта ${title}" aria-pressed="${index === 0}">${formatSlideNumber(index)}</button>`,
    )}
  </div>
`;

const renderProject = ({ title, years, linkLabel, images, ...layout }) => {
  const articleStyle = styleVars({
    "--music-main-min": layout.mainMin,
    "--music-slider-max": layout.sliderMax,
    "--music-slider-ratio": layout.sliderRatio,
    "--music-offset": layout.innerOffset,
  });

  return `
    <article class="music-shoots__project"${articleStyle ? ` style="${articleStyle}"` : ""}>
      <div class="music-shoots__inner">
        <div class="music-shoots__side">
          ${layout.counterPosition === "top" ? renderCounter(layout) : ""}
          <div class="music-shoots__meta">
            <h2>${title}</h2>
            <p>${years}</p>
            <a href="#">${linkLabel}</a>
          </div>
          ${layout.counterPosition === "bottom" ? renderCounter(layout) : ""}
        </div>
        <div class="music-shoots__slider" data-slider data-slide-count="${images.length}" style="--active-index: 0">
          <div class="music-shoots__track">${renderSlides(images)}</div>
          ${renderNav(images, title)}
        </div>
      </div>
    </article>
  `;
};

const getActiveIndex = (slider) => Number(slider.style.getPropertyValue("--active-index") || 0);

const setActiveSlide = (slider, nextIndex) => {
  const lastIndex = Number(slider.dataset.slideCount || 1) - 1;
  const activeIndex = Math.max(0, Math.min(nextIndex, lastIndex));

  slider.style.setProperty("--active-index", activeIndex);
  slider.querySelectorAll(".music-shoots__nav-button").forEach((button, index) => {
    button.setAttribute("aria-pressed", String(index === activeIndex));
  });
};

const handleSliderKeydown = (event) => {
  const slider = event.target.closest("[data-slider]");

  if (!slider) {
    return;
  }

  const lastIndex = Number(slider.dataset.slideCount || 1) - 1;
  const currentIndex = getActiveIndex(slider);
  const keyActions = {
    ArrowLeft: Math.max(0, currentIndex - 1),
    ArrowRight: Math.min(lastIndex, currentIndex + 1),
    Home: 0,
    End: lastIndex,
  };

  if (!(event.key in keyActions)) {
    return;
  }

  event.preventDefault();
  const nextIndex = keyActions[event.key];

  setActiveSlide(slider, nextIndex);
  slider.querySelector(`[data-slide-index="${nextIndex}"]`)?.focus();
};

export const renderMusicShoots = () => joinMarkup(PROJECTS, renderProject);

export function mountMusicShoots(containerId = "music-shoots") {
  const container = document.getElementById(containerId);

  if (!container || container.dataset.mounted === "true") {
    return;
  }

  container.dataset.mounted = "true";
  container.innerHTML = renderMusicShoots();

  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-slide-index]");

    if (!button) {
      return;
    }

    setActiveSlide(button.closest("[data-slider]"), Number(button.dataset.slideIndex));
  });

  container.addEventListener("keydown", handleSliderKeydown);
}
