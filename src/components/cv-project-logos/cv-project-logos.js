import jesteiLogoUrl from "../../assets/cv/logos/jestei-logo.svg?url";
import lyveLogoUrl from "../../assets/cv/logos/lyve-logo.svg?url";
import styxLogoUrl from "../../assets/cv/logos/styx-logo.svg?url";

const LOGO_URLS = {
  jestei: jesteiLogoUrl,
  lyve: lyveLogoUrl,
  styx: styxLogoUrl,
};

export function mountCvProjectLogos(root = document) {
  const logos = [...root.querySelectorAll("img[data-cv-logo]")];

  logos.forEach((logo) => {
    const logoUrl = LOGO_URLS[logo.dataset.cvLogo];

    if (!logoUrl) {
      return;
    }

    logo.src = logoUrl;
  });
}
