import "./styles/contacts.css";

const CONTACTS_SECTION_ID = "contacts";

function createContactsSection(root = document) {
  const section = root.createElement("section");
  section.id = CONTACTS_SECTION_ID;
  section.className = "section site-contacts";
  section.setAttribute("data-visual-system", "v2");
  section.setAttribute("aria-labelledby", "contacts-title");
  section.innerHTML = `
    <div class="site-contacts__screen">
      <h2 class="site-contacts__title" id="contacts-title">контакты</h2>
      <div class="site-contacts__layout">
        <nav class="site-contacts__links" aria-label="контакты">
          <a href="https://t.me/looksawful" target="_blank" rel="noreferrer">tg: @looksawful</a>
          <a href="mailto:i@lookawful.ru">email: i@lookawful.ru</a>
          <a href="https://github.com/looksawful" target="_blank" rel="noreferrer">github: @looksawful</a>
        </nav>
        <a class="site-contacts__top" href="#hero">↑ наверх</a>
      </div>
    </div>
  `;
  return section;
}

function revealContactsSection(section) {
  section.hidden = false;
  section.removeAttribute("aria-hidden");
  section.removeAttribute("data-homepage-hidden");
  section.style.setProperty("display", "block", "important");
  section.style.setProperty("visibility", "visible", "important");
  section.style.setProperty("opacity", "1", "important");
}

export function ensureContactsSection(root = document) {
  const main = root.getElementById?.("main");
  const resume = root.getElementById?.("resume");

  if (!main || !resume) {
    return null;
  }

  const section =
    root.getElementById?.(CONTACTS_SECTION_ID) || createContactsSection(root);

  if (resume.nextElementSibling !== section) {
    resume.insertAdjacentElement("afterend", section);
  }

  revealContactsSection(section);
  return section;
}

function startContactsSection() {
  let queued = false;

  const queueEnsure = () => {
    if (queued) {
      return;
    }

    queued = true;
    queueMicrotask(() => {
      queued = false;
      ensureContactsSection(document);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", queueEnsure, { once: true });
  } else {
    queueEnsure();
  }

  const main = document.getElementById("main");
  if (!main) {
    return;
  }

  const observer = new MutationObserver(queueEnsure);
  observer.observe(main, { childList: true });

  window.setTimeout(() => {
    observer.disconnect();
    ensureContactsSection(document);
  }, 8000);
}

startContactsSection();
