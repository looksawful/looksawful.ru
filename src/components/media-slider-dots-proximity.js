const initializedSliders = new WeakSet();

const getDistanceToElement = (event, element) => {
  const rect = element.getBoundingClientRect();

  const nearestX = Math.max(rect.left, Math.min(event.clientX, rect.right));
  const nearestY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));

  const distanceX = event.clientX - nearestX;
  const distanceY = event.clientY - nearestY;

  return Math.hypot(distanceX, distanceY);
};

export const initMediaSliderDotsProximity = () => {
  const sliders = document.querySelectorAll(".media-slider");

  sliders.forEach((slider) => {
    if (initializedSliders.has(slider)) {
      return;
    }

    const dots = slider.querySelector(".media-slider__dots");

    if (!dots) {
      return;
    }

    initializedSliders.add(slider);

    const showDistance = 120;
    const hideDistance = 170;

    const updateDotsVisibility = (event) => {
      const distance = getDistanceToElement(event, dots);
      const isVisible = slider.classList.contains("is-dots-visible");
      const threshold = isVisible ? hideDistance : showDistance;

      slider.classList.toggle("is-dots-visible", distance <= threshold);
    };

    const hideDots = () => {
      slider.classList.remove("is-dots-visible");
    };

    slider.addEventListener("pointermove", updateDotsVisibility);
    slider.addEventListener("pointerleave", hideDots);
  });
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMediaSliderDotsProximity);
} else {
  initMediaSliderDotsProximity();
}
