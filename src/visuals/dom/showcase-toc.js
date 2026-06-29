const CHAPTER_SELECTOR =
  ":scope .case-chapter[data-jestei-chapter-title], :scope .case-chapter[data-case-chapter-title]";
const ACTIVE_MARKER = 0.38;
const COMPACT_TOC_QUERY = "(max-width: 99.999rem)";

const getGsap = () => window.gsap || null;

const shouldReduceMotion = () => {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const isCompactToc = () => {
  return window.matchMedia(COMPACT_TOC_QUERY).matches;
};

const getHashId = (link) => {
  const href = link.getAttribute("href") || "";

  if (!href.startsWith("#")) {
    return "";
  }

  const rawId = href.slice(1);

  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
};

const ensureElementId = (element, baseId) => {
  if (element.id) {
    return element.id;
  }

  let id = baseId;
  let index = 2;

  while (document.getElementById(id) && document.getElementById(id) !== element) {
    id = `${baseId}-${index}`;
    index += 1;
  }

  element.id = id;
  return id;
};

const getChapterTitle = (chapter, index) => {
  return (
    chapter.dataset.jesteiChapterTitle ||
    chapter.dataset.caseChapterTitle ||
    chapter.querySelector(":scope > .case-chapter__header :is(h2, h3, h4, h5)")?.textContent?.trim() ||
    `глава ${index + 1}`
  );
};

const createChapterLink = ({ chapter, index, projectId }) => {
  const chapterId = ensureElementId(chapter, `${projectId}-chapter-${index + 1}`);
  const link = document.createElement("a");

  link.className = "portfolio-toc__link portfolio-toc__link--chapter";
  link.href = `#${chapterId}`;
  link.textContent = getChapterTitle(chapter, index);
  link.dataset.portfolioTocLink = "";
  link.dataset.portfolioTocChapterLink = "";
  link.dataset.projectId = projectId;

  return { link, target: chapter, projectId };
};

const buildProjectGroups = (panel) => {
  const projectLinks = [...panel.querySelectorAll(".portfolio-toc__link--project[data-portfolio-toc-link]")];

  return projectLinks
    .map((projectLink) => {
      const projectId = getHashId(projectLink);
      const project = projectId ? document.getElementById(projectId) : null;

      if (!(project instanceof HTMLElement)) {
        return null;
      }

      const group = document.createElement("div");
      const chapterList = document.createElement("div");
      const chapters = [...project.querySelectorAll(CHAPTER_SELECTOR)].map((chapter, index) =>
        createChapterLink({ chapter, index, projectId: project.id }),
      );

      group.className = "portfolio-toc__group";
      group.dataset.portfolioTocGroup = "";
      group.dataset.projectId = project.id;

      chapterList.className = "portfolio-toc__chapters";
      chapterList.id = `${project.id}-toc-chapters`;
      chapterList.dataset.portfolioTocChapters = "";
      chapterList.dataset.open = "false";

      projectLink.dataset.portfolioTocProjectLink = "";
      projectLink.dataset.projectId = project.id;
      projectLink.setAttribute("aria-expanded", "false");
      projectLink.setAttribute("aria-controls", chapterList.id);

      panel.insertBefore(group, projectLink);
      group.append(projectLink, chapterList);
      chapters.forEach(({ link }) => chapterList.append(link));

      return {
        group,
        project,
        projectId: project.id,
        projectLink,
        chapterList,
        chapters,
      };
    })
    .filter(Boolean);
};

export function initShowcaseToc(root = document) {
  const toc = root.querySelector("[data-portfolio-toc]");

  if (!(toc instanceof HTMLElement) || toc.dataset.ready === "true") {
    return;
  }

  const trigger = toc.querySelector("[data-portfolio-toc-trigger]");
  const panel = toc.querySelector("[data-portfolio-toc-panel]");

  if (!(panel instanceof HTMLElement)) {
    return;
  }

  toc.dataset.ready = "true";
  toc.dataset.mode = "static";
  panel.dataset.open = "true";

  if (trigger instanceof HTMLButtonElement) {
    trigger.hidden = true;
    trigger.setAttribute("aria-hidden", "true");
    trigger.tabIndex = -1;
  }

  const groups = buildProjectGroups(panel);
  const chapterEntries = groups.flatMap((item) =>
    item.chapters.map((chapter) => ({
      ...chapter,
      projectId: item.projectId,
    })),
  );
  const projectEntries = groups.map((item) => ({
    link: item.projectLink,
    target: item.project,
    projectId: item.projectId,
  }));

  let activeProjectId = "";
  let activeChapterLink = null;
  let scrollFrame = 0;

  const setChapterListOpen = (item, value, { instant = false } = {}) => {
    const gsap = getGsap();

    item.group.classList.toggle("is-expanded", value);
    item.chapterList.dataset.open = String(value);
    item.projectLink.setAttribute("aria-expanded", String(value));

    if (!item.chapters.length) {
      return;
    }

    if (!gsap || shouldReduceMotion() || instant) {
      item.chapterList.style.height = value ? "auto" : "0px";
      item.chapterList.style.opacity = value ? "1" : "0";
      item.chapterList.style.visibility = value ? "visible" : "hidden";
      item.chapterList.style.pointerEvents = value ? "auto" : "none";
      return;
    }

    if (value) {
      item.chapterList.style.visibility = "visible";
      item.chapterList.style.pointerEvents = "auto";
    }

    gsap.to(item.chapterList, {
      autoAlpha: value ? 1 : 0,
      height: value ? "auto" : 0,
      duration: instant ? 0 : 0.22,
      ease: "power3.out",
      overwrite: true,
      onComplete: () => {
        item.chapterList.style.height = value ? "auto" : "0px";
        item.chapterList.style.pointerEvents = value ? "auto" : "none";
      },
    });
  };

  const setActiveChapter = (link) => {
    activeChapterLink = link;

    chapterEntries.forEach((entry) => {
      const isActive = entry.link === activeChapterLink;
      entry.link.classList.toggle("is-active", isActive);
      entry.link.toggleAttribute("aria-current", isActive);
    });
  };

  const setActiveProject = (projectId, { instant = false } = {}) => {
    const nextProjectId = projectId || "";
    const projectChanged = activeProjectId !== nextProjectId;

    activeProjectId = nextProjectId;

    groups.forEach((item) => {
      const isActive = item.projectId === activeProjectId;

      item.group.classList.toggle("is-active", isActive);
      item.projectLink.classList.toggle("is-active", isActive);
      item.projectLink.toggleAttribute("aria-current", isActive && !activeChapterLink);

      if (projectChanged || instant) {
        const shouldOpen = isActive && !isCompactToc();

        setChapterListOpen(item, shouldOpen, {
          instant: instant || isCompactToc(),
        });
      }
    });
  };

  const findEntryAtMarker = (entries, marker) => {
    return (
      entries.find((entry) => {
        const rect = entry.target.getBoundingClientRect();
        return rect.top <= marker && rect.bottom >= marker;
      }) || null
    );
  };

  const findStartedChapter = (projectId, marker) => {
    let active = null;

    chapterEntries.forEach((entry) => {
      if (entry.projectId !== projectId) {
        return;
      }

      const rect = entry.target.getBoundingClientRect();

      if (rect.top <= marker && rect.bottom > 0) {
        active = entry;
      }
    });

    return active;
  };

  const updateActiveFromViewport = () => {
    scrollFrame = 0;

    const marker = window.innerHeight * ACTIVE_MARKER;
    const project = findEntryAtMarker(projectEntries, marker);
    const chapter = project
      ? findEntryAtMarker(chapterEntries.filter((entry) => entry.projectId === project.projectId), marker) ||
        findStartedChapter(project.projectId, marker)
      : null;

    setActiveChapter(chapter?.link || null);
    setActiveProject(project?.projectId || chapter?.projectId || "", { instant: shouldReduceMotion() });
  };

  const requestActiveUpdate = () => {
    if (scrollFrame) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(updateActiveFromViewport);
  };

  groups.forEach((item) => {
    setChapterListOpen(item, false, { instant: true });

    item.projectLink.addEventListener("click", () => {
      setActiveChapter(null);
      setActiveProject(item.projectId);
    });
  });

  chapterEntries.forEach((entry) => {
    entry.link.addEventListener("click", () => {
      setActiveChapter(entry.link);
      setActiveProject(entry.projectId);
    });
  });

  window.addEventListener("scroll", requestActiveUpdate, { passive: true });
  window.addEventListener("resize", requestActiveUpdate, { passive: true });
  window.addEventListener("hashchange", requestActiveUpdate);

  window.matchMedia(COMPACT_TOC_QUERY).addEventListener?.("change", () => {
    groups.forEach((item) => {
      setChapterListOpen(item, false, { instant: true });
    });

    requestActiveUpdate();
  });

  requestActiveUpdate();
}
