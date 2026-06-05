const NAV_LINKS = [
  { href: "/#cv", label: "проекты", match: "home" },
  { href: "/resume/", label: "резюме", match: "resume" },
  { href: "/#cv-jesteipool", label: "jestei pool", match: "jestei" },
  { href: "/#cv-styx-jewels", label: "styx", match: "styx" },
  { href: "/#cv-lyve-moscow", label: "lyve", match: "lyve" },
  { href: "/#pet-projects", label: "пет-проекты", match: "projects" },
];

export function renderSiteNavigation(active = "") {
  return `
    <header class="site-topbar" aria-label="главная навигация">
      <a class="site-topbar__brand" href="/#hero">иван крушинский</a>
      <nav class="site-topbar__links" aria-label="разделы сайта">
        ${NAV_LINKS.map(
          (link) => `
            <a href="${link.href}" ${active === link.match ? 'aria-current="page"' : ""}>${link.label}</a>
          `,
        ).join("")}
      </nav>
    </header>
  `;
}

export function renderSiteFooter() {
  return `
    <footer class="site-footer" aria-label="подвал сайта">
      <small>© 2026 иван крушинский. все права защищены.</small>
      <nav class="site-footer__links" aria-label="социальные ссылки">
        <a href="https://github.com/looksawful" target="_blank" rel="noreferrer">github</a>
        <a href="https://instagram.com/looksawful" target="_blank" rel="noreferrer">instagram</a>
        <a href="https://www.behance.net/looksawful" target="_blank" rel="noreferrer">behance</a>
        <a href="https://t.me/looksawful" target="_blank" rel="noreferrer">telegram</a>
      </nav>
    </footer>
  `;
}

export function initSiteNavigationState() {
  const topbar = document.querySelector(".site-topbar");

  if (!(topbar instanceof HTMLElement)) {
    return;
  }

  const update = () => {
    topbar.classList.toggle("is-scrolled", window.scrollY > 80);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  return () => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  };
}
