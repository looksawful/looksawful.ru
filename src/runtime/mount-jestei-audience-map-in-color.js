export function mountJesteiAudienceMapInColor(root = document) {
  const colorBento = root.querySelector("#jestei-color .jestei-color-bento");
  const audienceSection = root.querySelector("#jestei-audience-map");
  const brandStrip = colorBento?.querySelector(".jestei-color-bento__brand-strip");

  if (
    !(colorBento instanceof HTMLElement) ||
    !(audienceSection instanceof HTMLElement) ||
    !(brandStrip instanceof HTMLElement)
  ) {
    return;
  }

  audienceSection.classList.add("jestei-audience-map--inside-color");
  audienceSection.removeAttribute("hidden");
  audienceSection.removeAttribute("aria-hidden");
  audienceSection.style.removeProperty("display");
  audienceSection.style.removeProperty("visibility");
  audienceSection.style.removeProperty("opacity");

  if (brandStrip.previousElementSibling !== audienceSection) {
    brandStrip.insertAdjacentElement("beforebegin", audienceSection);
  }
}
