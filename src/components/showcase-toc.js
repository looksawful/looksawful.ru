const HEADING_SELECTOR = ".component-caption > .title, .project__head .title";

const normalizeId = (text, index) => {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `section-${index + 1}`;
};

const getProjectHeadings = (project) => {
  return [...project.querySelectorAll(HEADING_SELECTOR)].filter((heading) => {
    const text = heading.textContent?.trim();
    return text && !heading.closest("[hidden]");
  });
};

const ensureHeadingId = (project, heading, index) => {
  if (heading.id) {
    return heading.id;
  }

  const projectId = project.id || "project";
  heading.id = `${projectId}-${normalizeId(heading.textContent || "", index)}`;
  return heading.id;
};

const createToc = (parent) => {
  const nav = document.createElement("nav");
  nav.className = "showcase-toc";
  nav.setAttribute("aria-label", "навигация по проекту");

  const list = document.createElement("ol");
  list.className = "showcase-toc__list";
  nav.append(list);

  parent.append(nav);

  return { nav, list };
};

const getCurrentProject = (projects) => {
  const viewportCenter = window.innerHeight / 2;

  return projects.find((project) => {
    const rect = project.getBoundingClientRect();
    return rect.top <= viewportCenter && rect.bottom >= viewportCenter;
  });
};

const setVisible = (nav, showcase) => {
  const rect = showcase.getBoundingClientRect();
  const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
  nav.classList.toggle("is-visible", isVisible);
};

export function initShowcaseToc(root = document) {
  const showcase = root.getElementById("showcase");

  if (!(showcase instanceof HTMLElement)) {
    return;
  }

  const projects = [...showcase.querySelectorAll(".project")];

  if (!projects.length) {
    return;
  }

  const { nav, list } = createToc(showcase);
  let currentProject = null;
  let ticking = false;

  const render = (project) => {
    if (project === currentProject) {
      return;
    }

    currentProject = project;
    list.replaceChildren();

    if (!(project instanceof HTMLElement)) {
      return;
    }

    getProjectHeadings(project).forEach((heading, index) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const text = document.createElement("span");
      const headingId = ensureHeadingId(project, heading, index);

      link.className = "showcase-toc__link";
      link.href = `#${headingId}`;
      text.className = "showcase-toc__text";
      text.textContent = heading.textContent.trim();

      link.append(text);
      item.append(link);
      list.append(item);
    });
  };

  const updateActiveLink = () => {
    const links = [...list.querySelectorAll(".showcase-toc__link")];
    let activeLink = links[0];

    links.forEach((link) => {
      const target = document.getElementById(link.hash.slice(1));
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.getBoundingClientRect().top <= window.innerHeight * 0.38) {
        activeLink = link;
      }
    });

    links.forEach((link) => {
      link.classList.toggle("is-active", link === activeLink);
    });
  };

  const update = () => {
    ticking = false;
    setVisible(nav, showcase);
    render(getCurrentProject(projects));
    updateActiveLink();
  };

  const requestUpdate = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
}
