const noop = () => {};

export function initSiteNavigation(
  root: Document | HTMLElement = document,
): () => void {
  const navigation = root.querySelector<HTMLElement>("[data-site-navigation]");
  if (!(navigation instanceof HTMLElement)) return noop;

  const toggle = navigation.querySelector<HTMLButtonElement>("[data-site-menu-toggle]");
  const menu = navigation.querySelector<HTMLElement>("[data-site-menu]");
  if (!(toggle instanceof HTMLButtonElement) || !(menu instanceof HTMLElement)) {
    return noop;
  }

  const doc = navigation.ownerDocument;
  const body = doc.body;
  let open = false;
  let previousOverflow = "";

  const setOpen = (nextOpen: boolean, returnFocus = false): void => {
    if (nextOpen === open) return;

    open = nextOpen;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    navigation.toggleAttribute("data-menu-open", open);
    menu.hidden = !open;

    if (open) {
      previousOverflow = body.style.overflow;
      body.style.overflow = "hidden";
      return;
    }

    body.style.overflow = previousOverflow;
    if (returnFocus) toggle.focus();
  };

  const onToggle = (): void => setOpen(!open);
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && open) {
      setOpen(false, true);
    }
  };
  const onMenuClick = (event: Event): void => {
    const target = event.target;
    if (target instanceof Element && target.closest("a[href]")) {
      setOpen(false);
    }
  };

  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Открыть меню");
  navigation.removeAttribute("data-menu-open");
  menu.hidden = true;

  toggle.addEventListener("click", onToggle);
  doc.addEventListener("keydown", onKeyDown);
  menu.addEventListener("click", onMenuClick);

  return () => {
    toggle.removeEventListener("click", onToggle);
    doc.removeEventListener("keydown", onKeyDown);
    menu.removeEventListener("click", onMenuClick);

    if (open) {
      open = false;
      body.style.overflow = previousOverflow;
    }

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Открыть меню");
    navigation.removeAttribute("data-menu-open");
    menu.hidden = true;
  };
}
