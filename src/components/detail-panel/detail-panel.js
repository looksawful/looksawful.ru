const DEFAULT_OPTIONS = Object.freeze({
  mode: "auto",
  side: "end",
});

const DEFAULT_DRAWER_THRESHOLD = 768;
const VALID_FRAMES = new Set(["default", "edge-to-edge"]);

const DEFAULT_RENDERER_METRICS = Object.freeze({
  minInlineSize: "20rem",
  preferredInlineSize: "30rem",
  maxInlineSize: "48rem",
});

const VALID_PRESENTATIONS = new Set([
  "auto",
  "sheet",
  "drawer",
  "fullscreen",
  "split",
]);

function isElement(value) {
  return value instanceof Element;
}

function positiveNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeLength(value, fallback) {
  if (Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function lengthToCss(value) {
  return typeof value === "number" ? `${value}px` : value;
}

function resolveLength(value, context, fallback = 0) {
  if (Number.isFinite(value) && value > 0) return value;
  if (!(context instanceof HTMLElement) || typeof value !== "string") {
    return fallback;
  }

  const probe = document.createElement("span");
  probe.setAttribute("aria-hidden", "true");
  probe.style.cssText = `
    position: absolute;
    visibility: hidden;
    pointer-events: none;
    inline-size: ${value};
    block-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  `;
  context.append(probe);
  const pixels = probe.getBoundingClientRect().width;
  probe.remove();
  return Number.isFinite(pixels) && pixels > 0 ? pixels : fallback;
}

function normalizeRendererEntry(entry) {
  const source = typeof entry === "function" ? { mount: entry } : entry ?? {};

  return Object.freeze({
    minInlineSize: normalizeLength(
      source.minInlineSize,
      DEFAULT_RENDERER_METRICS.minInlineSize,
    ),
    preferredInlineSize: normalizeLength(
      source.preferredInlineSize,
      DEFAULT_RENDERER_METRICS.preferredInlineSize,
    ),
    maxInlineSize: normalizeLength(
      source.maxInlineSize,
      DEFAULT_RENDERER_METRICS.maxInlineSize,
    ),
    frame: VALID_FRAMES.has(source.frame) ? source.frame : "default",
    mount: typeof source.mount === "function" ? source.mount : null,
  });
}

function normalizeRendererResult(result) {
  if (typeof result === "function") {
    return {
      destroy: result,
      refresh: result.refresh,
    };
  }

  if (result && typeof result === "object") {
    return {
      destroy:
        typeof result.destroy === "function"
          ? result.destroy.bind(result)
          : () => {},
      refresh:
        typeof result.refresh === "function"
          ? result.refresh.bind(result)
          : undefined,
    };
  }

  return {
    destroy: () => {},
    refresh: undefined,
  };
}

export function resolveDetailPresentation({
  mode = "auto",
  layoutInlineSize = 0,
  drawerThreshold = DEFAULT_DRAWER_THRESHOLD,
  mainMinInlineSize = 0,
  rendererMinInlineSize = 0,
} = {}) {
  if (VALID_PRESENTATIONS.has(mode) && mode !== "auto") return mode;

  const available = Math.max(0, Number(layoutInlineSize) || 0);
  const drawerAt = positiveNumber(drawerThreshold, DEFAULT_DRAWER_THRESHOLD);
  const mainMinimum = positiveNumber(mainMinInlineSize, 0);
  const rendererMinimum = positiveNumber(rendererMinInlineSize, 0);

  if (available < drawerAt) return "sheet";
  if (available >= mainMinimum + rendererMinimum) return "split";
  return "drawer";
}

function nextAnimationFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

class DetailPanelController {
  constructor(root = document, options = {}) {
    this.root = root;
    this.layout = root.querySelector("[data-detail-layout]");
    this.slot = root.querySelector("[data-detail-slot]");
    this.host = root.querySelector("[data-detail-host]");
    this.surface = root.querySelector("[data-detail-surface]");
    this.identity = root.querySelector("[data-detail-identity]");
    this.context = root.querySelector("[data-detail-context]");
    this.title = root.querySelector("[data-detail-title]");
    this.content = root.querySelector("[data-detail-content]");
    this.footer = root.querySelector("[data-detail-footer]");
    this.scrollRegion = root.querySelector("[data-detail-scroll]");
    this.dragZone = root.querySelector("[data-detail-drag]");
    this.resizeHandle = root.querySelector("[data-detail-resize]");

    this.mode = VALID_PRESENTATIONS.has(options.mode)
      ? options.mode
      : DEFAULT_OPTIONS.mode;
    this.side = options.side === "start" ? "start" : DEFAULT_OPTIONS.side;
    this.drawerThreshold =
      options.drawerThreshold === undefined
        ? null
        : normalizeLength(options.drawerThreshold, null);
    this.mainMinInlineSize =
      options.mainMinInlineSize === undefined
        ? null
        : normalizeLength(options.mainMinInlineSize, null);
    this.motion = options.motion ?? null;
    this.renderers = new Map(
      Object.entries(options.renderers ?? {}).map(([kind, renderer]) => [
        kind,
        normalizeRendererEntry(renderer),
      ]),
    );
    this.resolveTheme =
      typeof options.resolveTheme === "function"
        ? options.resolveTheme
        : null;
    this.onStateChange =
      typeof options.onStateChange === "function"
        ? options.onStateChange
        : () => {};

    this.presentation = "sheet";
    this.presentationOverride = null;
    this.activeId = null;
    this.activeTemplate = null;
    this.trigger = null;
    this.dragSession = null;
    this.resizeSession = null;
    this.splitRatio = null;
    this.resizeFrame = 0;
    this.presentFrame = 0;
    this.contentMountVersion = 0;
    this.closeVersion = 0;
    this.destroyed = false;
    this.savedDocumentScroll = null;
    this.savedDocumentStyles = null;
    this.savedHistoryScrollRestoration = null;
    this.scrollRestoreFrame = 0;
    this.scrollPositions = new Map();
    this.rendererRuntime = null;
    this.activeRenderer = normalizeRendererEntry(null);
    this.historyMode = "none";
    this.returnUrl = null;
    this.returnState = null;
    this.abortController = new AbortController();

    const required = [
      this.layout,
      this.slot,
      this.host,
      this.surface,
      this.identity,
      this.context,
      this.title,
      this.content,
      this.footer,
      this.scrollRegion,
      this.dragZone,
      this.resizeHandle,
    ];

    if (required.some((node) => !(node instanceof HTMLElement))) {
      throw new Error("DetailPanelController: required nodes are missing.");
    }

    if (!(this.host instanceof HTMLDialogElement)) {
      throw new Error("DetailPanelController: data-detail-host must be a dialog.");
    }

    this.applySide();
    this.bind();
    this.observe();
    this.openInitialDetail();
  }

  bind() {
    const { signal } = this.abortController;

    this.root.addEventListener(
      "click",
      (event) => {
        if (!isElement(event.target)) return;

        const opener = event.target.closest("[data-detail-open]");
        if (opener instanceof HTMLElement) {
          const id = opener.dataset.detailOpen;

          if (id) {
            event.preventDefault();
            this.open(id, {
              trigger: opener,
              historyMode: opener.dataset.detailHistory ?? "push",
              presentation: opener.dataset.detailPresentation ?? null,
            });
          }

          return;
        }

        if (event.target.closest("[data-detail-back]")) {
          event.preventDefault();
          this.requestClose();
        }
      },
      { signal },
    );

    this.host.addEventListener(
      "cancel",
      (event) => {
        event.preventDefault();
        this.requestClose();
      },
      { signal },
    );

    this.host.addEventListener(
      "click",
      (event) => {
        if (event.target === this.host) {
          this.requestClose();
        }
      },
      { signal },
    );

    this.dragZone.addEventListener(
      "pointerdown",
      (event) => this.beginDrag(event),
      { signal },
    );
    this.dragZone.addEventListener(
      "pointermove",
      (event) => this.moveDrag(event),
      { signal },
    );
    this.dragZone.addEventListener(
      "pointerup",
      (event) => this.endDrag(event),
      { signal },
    );
    this.dragZone.addEventListener(
      "pointercancel",
      (event) => this.cancelDrag(event),
      { signal },
    );

    this.resizeHandle.addEventListener(
      "pointerdown",
      (event) => this.beginResize(event),
      { signal },
    );
    this.resizeHandle.addEventListener(
      "pointermove",
      (event) => this.moveResize(event),
      { signal },
    );
    this.resizeHandle.addEventListener(
      "pointerup",
      (event) => this.endResize(event),
      { signal },
    );
    this.resizeHandle.addEventListener(
      "pointercancel",
      (event) => this.endResize(event),
      { signal },
    );
    this.resizeHandle.addEventListener(
      "keydown",
      (event) => this.keyboardResize(event),
      { signal },
    );

    window.addEventListener(
      "popstate",
      (event) => this.handlePopState(event),
      { signal },
    );
  }

  observe() {
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.activeId || this.destroyed) return;

      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = 0;

        const next = this.resolvePresentation();
        if (next !== this.presentation) {
          this.present({ focus: false, immediate: true });
          return;
        }

        if (this.presentation === "split") {
          this.reconcileSplitSize();
        }

        this.rendererRuntime?.refresh?.();
      });
    });

    this.resizeObserver.observe(this.layout);
  }

  getTemplate(id) {
    const template = this.root.getElementById(id);
    return template instanceof HTMLTemplateElement ? template : null;
  }

  idFromUrl() {
    return new URLSearchParams(location.hash.slice(1)).get("detail");
  }

  openInitialDetail() {
    const initialId = this.idFromUrl();
    if (!initialId || !this.getTemplate(initialId)) return;

    const returnUrl = new URL(location.href);
    returnUrl.hash = "";
    this.returnUrl = returnUrl.href;
    this.returnState = null;
    this.historyMode = "replace";
    history.replaceState({ detailId: initialId }, "", location.href);
    this.open(initialId, {
      historyMode: "none",
      focus: false,
      immediate: true,
    });
  }

  resolvePresentation() {
    const mode =
      this.presentationOverride &&
      VALID_PRESENTATIONS.has(this.presentationOverride)
        ? this.presentationOverride
        : this.mode;

    const metrics = this.resolveRendererMetrics();

    return resolveDetailPresentation({
      mode,
      layoutInlineSize: this.layout.getBoundingClientRect().width,
      drawerThreshold: this.resolveDrawerThreshold(),
      mainMinInlineSize: this.resolveMainMinInlineSize(),
      rendererMinInlineSize: metrics.minInlineSize,
    });
  }

  setMode(mode) {
    if (!VALID_PRESENTATIONS.has(mode)) return;
    this.mode = mode;

    if (this.activeId) {
      this.present({ focus: false, immediate: true });
    }
  }

  setSide(side) {
    this.side = side === "start" ? "start" : "end";
    this.applySide();

    if (this.activeId) {
      this.present({ focus: false, immediate: true });
    }
  }

  applySide() {
    this.layout.dataset.side = this.side;
    this.host.dataset.side = this.side;
    this.surface.dataset.side = this.side;
  }

  applySourceTheme(trigger) {
    this.clearSourceTheme();

    const theme = this.resolveTheme?.({
      trigger,
      panel: this,
      surface: this.surface,
    });

    if (!theme || typeof theme !== "object") return;

    if (theme.background) {
      this.surface.style.setProperty(
        "--detail-panel-background",
        theme.background,
      );
    }

    if (theme.foreground) {
      this.surface.style.setProperty(
        "--detail-panel-foreground",
        theme.foreground,
      );
    }
  }

  open(
    id,
    {
      trigger = null,
      historyMode = "push",
      presentation = null,
      focus = true,
      immediate = false,
    } = {},
  ) {
    if (this.destroyed) return false;

    const template = this.getTemplate(id);
    if (!template) return false;

    this.closeVersion += 1;

    if (!this.activeId) {
      this.returnUrl = location.href;
      this.returnState = history.state;
    } else {
      this.scrollPositions.set(this.activeId, this.scrollRegion.scrollTop);
    }

    this.activeId = id;
    this.activeTemplate = template;
    this.trigger =
      trigger instanceof HTMLElement
        ? trigger
        : this.trigger ??
          (document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null);
    this.presentationOverride = VALID_PRESENTATIONS.has(presentation)
      ? presentation
      : null;
    this.applySourceTheme(this.trigger);
    this.render(template);
    this.present({ focus, immediate });
    this.updateHistory(id, historyMode);

    return true;
  }

  updateHistory(id, requestedMode) {
    const mode = ["push", "replace", "none"].includes(requestedMode)
      ? requestedMode
      : "push";

    if (mode === "none") return;

    const url = new URL(location.href);
    url.hash = `detail=${encodeURIComponent(id)}`;
    const state = { ...(history.state ?? {}), detailId: id };

    if (history.state?.detailId || mode === "replace") {
      history.replaceState(state, "", url);
      this.historyMode = mode === "replace" ? "replace" : this.historyMode;
      return;
    }

    history.pushState(state, "", url);
    this.historyMode = "push";
  }

  handlePopState(event) {
    if (this.destroyed) return;

    const id = event.state?.detailId ?? this.idFromUrl();
    if (id && this.getTemplate(id)) {
      this.open(id, {
        historyMode: "none",
        focus: false,
        immediate: true,
      });
      return;
    }

    this.close({
      restoreFocus: true,
      updateHistory: false,
      immediate: true,
    });
  }

  render(template) {
    this.destroyRenderer();

    const kind = template.dataset.detailKind ?? "article";
    this.activeRenderer = this.renderers.get(kind) ?? normalizeRendererEntry(null);
    this.context.textContent = template.dataset.detailContext ?? "";
    this.title.textContent = template.dataset.detailTitle ?? "";
    this.splitRatio = null;
    this.applyRendererMetrics();
    this.surface.dataset.kind = kind;
    this.surface.dataset.frame = template.dataset.detailFrame ?? this.activeRenderer.frame;
    this.surface.dataset.size = template.dataset.detailSize ?? "reading";
    this.layout.dataset.detailKind = kind;
    this.content.replaceChildren(template.content.cloneNode(true));
    this.footer.replaceChildren();
    this.footer.hidden = true;
    this.surface.dataset.contentState = "ready";
  }

  async present({ focus = true, immediate = false } = {}) {
    if (!this.activeId || this.destroyed) return;

    const next = this.resolvePresentation();
    this.presentation = next;
    this.layout.dataset.presentation = next;
    this.host.dataset.presentation = next;
    this.surface.dataset.presentation = next;
    this.resetDragOffset();

    if (next === "split") {
      this.mountSplit();
    } else {
      this.mountModal(next, { immediate });
    }

    this.scrollRegion.scrollTop = this.scrollPositions.get(this.activeId) ?? 0;
    this.updateTriggers(true);

    cancelAnimationFrame(this.presentFrame);
    this.presentFrame = requestAnimationFrame(() => {
      this.presentFrame = 0;
      this.mountRenderer();
      this.rendererRuntime?.refresh?.();
    });

    if (focus) {
      this.identity.focus({ preventScroll: true });
    }

    this.emitState(true);
  }

  mountSplit() {
    if (this.host.open) this.host.close();
    this.unlockDocumentScroll();
    this.slot.hidden = false;
    this.slot.append(this.surface);
    this.layout.dataset.panelState = "open";
    this.surface.dataset.state = "open";
    this.host.dataset.state = "closed";
    this.syncResizeAria();
  }

  mountModal(presentation, { immediate = false } = {}) {
    this.layout.dataset.panelState = "closed";
    this.slot.hidden = true;
    this.host.append(this.surface);
    this.host.dataset.presentation = presentation;
    this.host.dataset.state = immediate ? "open" : "opening";
    this.surface.dataset.state = immediate ? "open" : "opening";

    if (!this.host.open) {
      this.host.showModal();
      this.lockDocumentScroll();
    }

    requestAnimationFrame(() => {
      if (!this.activeId || this.destroyed) return;
      this.host.dataset.state = "open";
      this.surface.dataset.state = "open";
    });
  }

  async mountRenderer() {
    const template = this.activeTemplate;
    if (!template || this.rendererRuntime || this.destroyed) return;

    const renderer = this.activeRenderer.mount;
    if (typeof renderer !== "function") return;

    const mountVersion = ++this.contentMountVersion;
    this.surface.dataset.contentState = "loading";

    try {
      await nextAnimationFrame();

      if (
        this.destroyed ||
        mountVersion !== this.contentMountVersion ||
        !this.activeId ||
        !this.content.isConnected
      ) {
        return;
      }

      const result = await renderer({
        root: this.content,
        template,
        surface: this.surface,
        panel: this,
        motion: this.motion,
      });

      const runtime = normalizeRendererResult(result);

      if (
        this.destroyed ||
        mountVersion !== this.contentMountVersion ||
        !this.activeId
      ) {
        runtime.destroy();
        return;
      }

      this.rendererRuntime = runtime;
      this.surface.dataset.contentState = "ready";
      runtime.refresh?.();
    } catch (error) {
      console.error("Detail panel content could not start.", error);

      if (mountVersion !== this.contentMountVersion || this.destroyed) return;

      this.surface.dataset.contentState = "error";
      const message = document.createElement("p");
      message.textContent = "Не удалось загрузить содержимое.";
      this.content.replaceChildren(message);
    }
  }

  destroyRenderer() {
    this.contentMountVersion += 1;
    this.rendererRuntime?.destroy?.();
    this.rendererRuntime = null;
  }

  requestClose() {
    if (!this.activeId) return;

    if (this.historyMode === "push" && history.state?.detailId) {
      history.back();
      return;
    }

    this.close({ updateHistory: true });
  }

  async close({
    restoreFocus = true,
    updateHistory = true,
    immediate = false,
  } = {}) {
    if (!this.activeId) return;

    const version = ++this.closeVersion;
    const trigger = this.trigger;
    const closedId = this.activeId;
    this.scrollPositions.set(closedId, this.scrollRegion.scrollTop);
    this.surface.dataset.state = "closing";
    this.host.dataset.state = "closing";

    if (
      !immediate &&
      this.presentation !== "split" &&
      this.motionDuration() > 0
    ) {
      await this.waitForTransition(
        this.surface,
        this.motionDuration() + 80,
      );
    }

    if (version !== this.closeVersion || this.destroyed) return;

    this.finishClose({
      trigger,
      closedId,
      restoreFocus,
      updateHistory,
    });
  }

  finishClose({ trigger, closedId, restoreFocus, updateHistory }) {
    cancelAnimationFrame(this.presentFrame);
    this.presentFrame = 0;

    if (this.host.open) this.host.close();
    this.unlockDocumentScroll();
    cancelAnimationFrame(this.scrollRestoreFrame);
    this.scrollRestoreFrame = 0;
    if (this.savedHistoryScrollRestoration !== null) {
      history.scrollRestoration = this.savedHistoryScrollRestoration;
      this.savedHistoryScrollRestoration = null;
    }
    this.slot.hidden = true;
    this.layout.dataset.panelState = "closed";
    delete this.layout.dataset.detailKind;
    this.surface.dataset.state = "closed";
    this.surface.dataset.contentState = "idle";
    this.host.dataset.state = "closed";
    this.destroyRenderer();
    this.content.replaceChildren();
    this.updateTriggers(false);
    this.activeId = null;
    this.activeTemplate = null;
    this.activeRenderer = normalizeRendererEntry(null);
    delete this.surface.dataset.kind;
    delete this.surface.dataset.frame;
    delete this.surface.dataset.size;
    this.clearRendererMetrics();
    this.trigger = null;
    this.presentationOverride = null;
    this.resetDragOffset();
    this.clearSourceTheme();

    if (updateHistory && history.state?.detailId) {
      history.replaceState(
        this.returnState,
        "",
        this.returnUrl ?? new URL(location.href),
      );
    }

    this.historyMode = "none";
    this.returnUrl = null;
    this.returnState = null;

    if (restoreFocus && trigger instanceof HTMLElement && trigger.isConnected) {
      requestAnimationFrame(() => {
        if (trigger.isConnected) {
          trigger.focus({ preventScroll: true });
        }
      });
    }

    this.emitState(false, closedId);
  }

  clearSourceTheme() {
    this.surface.style.removeProperty("--detail-panel-background");
    this.surface.style.removeProperty("--detail-panel-foreground");
  }

  updateTriggers(open) {
    this.root.querySelectorAll("[data-detail-open]").forEach((control) => {
      if (!(control instanceof HTMLElement)) return;
      const selected = open && control.dataset.detailOpen === this.activeId;
      control.setAttribute("aria-expanded", String(selected));
    });
  }

  emitState(open, id = this.activeId) {
    const detail = {
      open,
      id,
      presentation: this.presentation,
      kind: this.surface.dataset.kind ?? null,
    };

    this.onStateChange(detail);
    this.layout.dispatchEvent(
      new CustomEvent("detailpanel:change", {
        bubbles: true,
        detail,
      }),
    );
  }

  lockDocumentScroll() {
    if (this.savedDocumentScroll !== null) return;

    cancelAnimationFrame(this.scrollRestoreFrame);
    this.scrollRestoreFrame = 0;

    if (this.savedHistoryScrollRestoration === null) {
      this.savedHistoryScrollRestoration = history.scrollRestoration;
    }
    history.scrollRestoration = "manual";

    const body = document.body;
    const documentElement = document.documentElement;
    const scrollbarWidth = Math.max(
      0,
      window.innerWidth - documentElement.clientWidth,
    );

    this.savedDocumentScroll = window.scrollY;
    this.savedDocumentStyles = {
      htmlScrollBehavior: documentElement.style.scrollBehavior,
      bodyPosition: body.style.position,
      bodyInset: body.style.inset,
      bodyInlineSize: body.style.inlineSize,
      bodyPaddingInlineEnd: body.style.paddingInlineEnd,
    };

    documentElement.style.scrollBehavior = "auto";
    body.style.position = "fixed";
    body.style.inset = `-${this.savedDocumentScroll}px 0 0`;
    body.style.inlineSize = "100%";

    if (scrollbarWidth > 0) {
      body.style.paddingInlineEnd = `${scrollbarWidth}px`;
    }
  }

  unlockDocumentScroll() {
    if (this.savedDocumentScroll === null) return;

    const body = document.body;
    const documentElement = document.documentElement;
    const y = this.savedDocumentScroll;
    const saved = this.savedDocumentStyles;

    documentElement.style.scrollBehavior = saved?.htmlScrollBehavior ?? "";
    body.style.position = saved?.bodyPosition ?? "";
    body.style.inset = saved?.bodyInset ?? "";
    body.style.inlineSize = saved?.bodyInlineSize ?? "";
    body.style.paddingInlineEnd = saved?.bodyPaddingInlineEnd ?? "";
    this.savedDocumentScroll = null;
    this.savedDocumentStyles = null;

    const restore = () => {
      this.scrollRestoreFrame = 0;
      window.scrollTo({ top: y, behavior: "auto" });

      if (this.savedDocumentScroll === null) {
        history.scrollRestoration =
          this.savedHistoryScrollRestoration ?? "auto";
        this.savedHistoryScrollRestoration = null;
      }
    };

    window.scrollTo({ top: y, behavior: "auto" });
    this.scrollRestoreFrame = requestAnimationFrame(restore);
  }

  motionDuration() {
    if (this.motion?.isReduced?.()) return 0;

    const value = getComputedStyle(this.surface).getPropertyValue(
      "--detail-panel-transition-duration",
    );
    return Number.parseFloat(value) || 0;
  }

  waitForTransition(element, timeout) {
    return new Promise((resolve) => {
      let done = false;
      let timer = 0;

      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        element.removeEventListener("transitionend", finish);
        resolve();
      };

      element.addEventListener("transitionend", finish, { once: true });
      timer = window.setTimeout(finish, timeout);
    });
  }

  beginDrag(event) {
    if (this.presentation !== "sheet" || !event.isPrimary) return;
    if (this.scrollRegion.scrollTop > 0) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    this.dragSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
      offset: 0,
      active: false,
    };
    this.dragZone.setPointerCapture(event.pointerId);
  }

  moveDrag(event) {
    const session = this.dragSession;
    if (!session || event.pointerId !== session.pointerId) return;

    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;

    if (!session.active) {
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
        this.cancelDrag(event);
        return;
      }

      if (dy <= 6) return;
      session.active = true;
      this.surface.dataset.dragging = "true";
    }

    const offset = Math.max(0, dy);
    const elapsed = Math.max(1, event.timeStamp - session.lastTime);
    session.velocity = (event.clientY - session.lastY) / elapsed;
    session.lastY = event.clientY;
    session.lastTime = event.timeStamp;
    session.offset = offset;
    this.surface.style.setProperty(
      "--detail-panel-drag-offset",
      `${offset}px`,
    );
  }

  endDrag(event) {
    const session = this.dragSession;
    if (!session || event.pointerId !== session.pointerId) return;

    const threshold = Math.min(
      150,
      this.surface.getBoundingClientRect().height * 0.18,
    );
    const dismiss =
      session.active &&
      (session.offset >= threshold || session.velocity >= 0.65);

    this.releaseDrag(event);

    if (dismiss) this.requestClose();
    else this.resetDragOffset();
  }

  cancelDrag(event) {
    if (!this.dragSession) return;
    this.releaseDrag(event);
    this.resetDragOffset();
  }

  releaseDrag(event) {
    if (this.dragZone.hasPointerCapture?.(event.pointerId)) {
      this.dragZone.releasePointerCapture(event.pointerId);
    }

    this.dragSession = null;
    delete this.surface.dataset.dragging;
  }

  resetDragOffset() {
    this.surface.style.setProperty("--detail-panel-drag-offset", "0px");
  }

  resolveCustomPropertyLength(propertyName, fallback) {
    const value = getComputedStyle(this.layout).getPropertyValue(propertyName).trim();
    return resolveLength(value, this.layout, fallback);
  }

  resolveDrawerThreshold() {
    const fallback = resolveLength("48rem", this.layout, DEFAULT_DRAWER_THRESHOLD);

    if (this.drawerThreshold !== null) {
      return resolveLength(this.drawerThreshold, this.layout, fallback);
    }

    return this.resolveCustomPropertyLength(
      "--detail-panel-drawer-threshold",
      fallback,
    );
  }

  resolveMainMinInlineSize() {
    const fallback = resolveLength("34rem", this.layout, 0);

    if (this.mainMinInlineSize !== null) {
      return resolveLength(this.mainMinInlineSize, this.layout, fallback);
    }

    return this.resolveCustomPropertyLength("--detail-panel-main-min", fallback);
  }

  resolveRendererMetrics() {
    const minInlineSize = resolveLength(
      this.activeRenderer.minInlineSize,
      this.layout,
      resolveLength(DEFAULT_RENDERER_METRICS.minInlineSize, this.layout, 0),
    );
    const preferredInlineSize = Math.max(
      minInlineSize,
      resolveLength(
        this.activeRenderer.preferredInlineSize,
        this.layout,
        minInlineSize,
      ),
    );
    const maxInlineSize = Math.max(
      preferredInlineSize,
      resolveLength(
        this.activeRenderer.maxInlineSize,
        this.layout,
        preferredInlineSize,
      ),
    );

    return { minInlineSize, preferredInlineSize, maxInlineSize };
  }

  applyRendererMetrics() {
    const metrics = this.activeRenderer;
    this.layout.style.setProperty(
      "--detail-panel-split-min",
      lengthToCss(metrics.minInlineSize),
    );
    this.layout.style.setProperty(
      "--detail-panel-split-size",
      lengthToCss(metrics.preferredInlineSize),
    );
    this.layout.style.setProperty(
      "--detail-panel-split-max",
      lengthToCss(metrics.maxInlineSize),
    );
    this.surface.style.setProperty(
      "--detail-panel-drawer-preferred",
      lengthToCss(metrics.preferredInlineSize),
    );
  }

  clearRendererMetrics() {
    this.layout.style.removeProperty("--detail-panel-split-min");
    this.layout.style.removeProperty("--detail-panel-split-size");
    this.layout.style.removeProperty("--detail-panel-split-max");
    this.surface.style.removeProperty("--detail-panel-drawer-preferred");
  }

  resizeBounds() {
    const metrics = this.resolveRendererMetrics();
    const available = Math.max(
      metrics.minInlineSize,
      this.layout.clientWidth - this.resolveMainMinInlineSize(),
    );

    return {
      min: metrics.minInlineSize,
      max: Math.max(
        metrics.minInlineSize,
        Math.min(metrics.maxInlineSize, available),
      ),
    };
  }

  beginResize(event) {
    if (this.presentation !== "split" || !event.isPrimary) return;

    this.resizeSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startSize: this.surface.getBoundingClientRect().width,
    };
    this.resizeHandle.setPointerCapture(event.pointerId);
  }

  moveResize(event) {
    const session = this.resizeSession;
    if (!session || event.pointerId !== session.pointerId) return;

    const delta = event.clientX - session.startX;
    const directional = this.side === "end" ? -delta : delta;
    this.setSplitSize(session.startSize + directional);
  }

  endResize(event) {
    if (!this.resizeSession) return;

    if (this.resizeHandle.hasPointerCapture?.(event.pointerId)) {
      this.resizeHandle.releasePointerCapture(event.pointerId);
    }

    this.resizeSession = null;
  }

  keyboardResize(event) {
    if (this.presentation !== "split") return;

    const current = this.surface.getBoundingClientRect().width;
    const { min, max } = this.resizeBounds();
    const step = event.shiftKey ? 64 : 24;
    let next = current;

    if (event.key === "Home") next = min;
    else if (event.key === "End") next = max;
    else if (event.key === "ArrowLeft") {
      next = current + (this.side === "end" ? step : -step);
    } else if (event.key === "ArrowRight") {
      next = current + (this.side === "end" ? -step : step);
    } else {
      return;
    }

    event.preventDefault();
    this.setSplitSize(next);
  }

  setSplitSize(value, { updateRatio = true } = {}) {
    const { min, max } = this.resizeBounds();
    const next = Math.min(max, Math.max(min, value));

    if (updateRatio) {
      this.splitRatio = next / Math.max(1, this.layout.clientWidth);
    }

    const current = Number.parseFloat(
      this.layout.style.getPropertyValue("--detail-panel-split-size"),
    );

    if (!Number.isFinite(current) || Math.abs(current - next) > 0.5) {
      this.layout.style.setProperty(
        "--detail-panel-split-size",
        `${next}px`,
      );
    }

    this.syncResizeAria(next, min, max);
  }

  reconcileSplitSize() {
    const { min, max } = this.resizeBounds();

    if (this.splitRatio === null) {
      const rendered = this.surface.getBoundingClientRect().width;
      this.syncResizeAria(rendered, min, max);
      return;
    }

    const proportional = this.layout.clientWidth * this.splitRatio;
    this.setSplitSize(proportional, { updateRatio: false });
  }

  syncResizeAria(
    value = this.surface.getBoundingClientRect().width,
    min,
    max,
  ) {
    const bounds = min === undefined ? this.resizeBounds() : { min, max };
    this.resizeHandle.setAttribute(
      "aria-valuemin",
      String(Math.round(bounds.min)),
    );
    this.resizeHandle.setAttribute(
      "aria-valuemax",
      String(Math.round(bounds.max)),
    );
    this.resizeHandle.setAttribute(
      "aria-valuenow",
      String(Math.round(value)),
    );
  }

  refresh() {
    if (this.destroyed) return;

    if (this.activeId) {
      const next = this.resolvePresentation();
      if (next !== this.presentation) {
        this.present({ focus: false, immediate: true });
        return;
      }
    }

    if (this.presentation === "split") {
      this.reconcileSplitSize();
    }

    this.rendererRuntime?.refresh?.();
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;
    this.closeVersion += 1;
    this.abortController.abort();
    this.resizeObserver.disconnect();
    cancelAnimationFrame(this.resizeFrame);
    cancelAnimationFrame(this.presentFrame);
    this.resizeFrame = 0;
    this.presentFrame = 0;

    const closedId = this.activeId;
    const trigger = this.trigger;

    if (this.host.open) this.host.close();
    this.unlockDocumentScroll();
    this.slot.hidden = true;
    this.layout.dataset.panelState = "closed";
    delete this.layout.dataset.detailKind;
    this.surface.dataset.state = "closed";
    this.host.dataset.state = "closed";
    this.destroyRenderer();
    this.content.replaceChildren();
    this.activeId = null;
    this.activeTemplate = null;
    this.activeRenderer = normalizeRendererEntry(null);
    delete this.surface.dataset.kind;
    delete this.surface.dataset.frame;
    delete this.surface.dataset.size;
    this.clearRendererMetrics();
    this.trigger = null;
    this.updateTriggers(false);
    this.clearSourceTheme();

    if (closedId) {
      this.onStateChange({
        open: false,
        id: closedId,
        presentation: this.presentation,
        kind: null,
      });
    }

    if (trigger instanceof HTMLElement) {
      trigger.removeAttribute("data-detail-active");
    }
  }
}

export function createDetailPanel(options = {}) {
  const root = options.root ?? document;
  const layout = root.querySelector("[data-detail-layout]");

  if (!(layout instanceof HTMLElement)) {
    return () => {};
  }

  const controller = new DetailPanelController(root, options);
  const destroy = () => controller.destroy();

  destroy.open = (...args) => controller.open(...args);
  destroy.close = (...args) => controller.close(...args);
  destroy.setMode = (...args) => controller.setMode(...args);
  destroy.setSide = (...args) => controller.setSide(...args);
  destroy.refresh = () => controller.refresh();
  destroy.controller = controller;

  return destroy;
}
