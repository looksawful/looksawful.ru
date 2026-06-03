const NAV_LINKS = [
  { href: "/resume/", label: "резюме", match: "resume" },
  { href: "/#pet-projects", label: "пет-проекты", match: "projects" },
  { href: "/#cv-jesteipool", label: "jestei pool", match: "jestei" },
  { href: "/#cv-styx-jewels", label: "styx", match: "styx" },
  { href: "/#cv-lyve-moscow", label: "lyve", match: "lyve" },
  { href: "/#contact-links", label: "контакты", match: "contacts" },
];

export function renderSiteNavigation(active = "") {
  return `
    <header class="site-topbar" aria-label="главная навигация">
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
