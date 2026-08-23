import assert from "node:assert/strict";
import test from "node:test";

class FakeHTMLElement extends EventTarget {
  constructor() {
    super();
    this.dataset = {};
    this.textContent = "";
    this.disabled = false;
    this.width = 1200;
    this.queryOne = new Map();
    this.queryMany = new Map();
  }

  querySelector(selector) {
    return this.queryOne.get(selector) ?? null;
  }

  querySelectorAll(selector) {
    return this.queryMany.get(selector) ?? [];
  }

  getBoundingClientRect() {
    return { width: this.width };
  }
}

class FakeButton extends FakeHTMLElement {}

class FakeScript extends FakeHTMLElement {
  constructor() {
    super();
    this.src = "";
    this.async = false;
  }
}

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
};

test("page flip preserves loader, options, controls, orientation, motion and cleanup behavior", async () => {
  globalThis.HTMLElement = FakeHTMLElement;
  globalThis.HTMLButtonElement = FakeButton;
  globalThis.HTMLScriptElement = FakeScript;
  globalThis.getComputedStyle = () => ({ fontSize: "16px" });

  let latestObserver = null;
  class FakeIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = [];
      this.disconnected = false;
      latestObserver = this;
    }

    observe(target) {
      this.observed.push(target);
    }

    disconnect() {
      this.disconnected = true;
    }

    trigger(entries) {
      this.callback(entries);
    }
  }
  globalThis.IntersectionObserver = FakeIntersectionObserver;

  const scriptNodes = [];
  const documentElement = new FakeHTMLElement();
  globalThis.document = {
    documentElement,
    head: {
      append(node) {
        scriptNodes.push(node);
      },
    },
    querySelector(selector) {
      if (selector !== 'script[data-page-flip-library]') return null;
      return scriptNodes.find((node) => Object.hasOwn(node.dataset, "pageFlipLibrary")) ?? null;
    },
    createElement(tag) {
      assert.equal(tag, "script");
      return new FakeScript();
    },
    querySelectorAll() {
      return [];
    },
  };
  globalThis.window = {};

  const instances = [];
  class FakePageFlip {
    constructor(book, options) {
      this.book = book;
      this.options = options;
      this.current = 0;
      this.pageCount = 6;
      this.handlers = new Map();
      this.loadedPages = null;
      this.prevCalls = [];
      this.nextCalls = [];
      this.destroyed = false;
      instances.push(this);
    }

    on(name, callback) {
      const list = this.handlers.get(name) ?? [];
      list.push(callback);
      this.handlers.set(name, list);
    }

    emit(name, event) {
      for (const callback of this.handlers.get(name) ?? []) callback(event);
    }

    loadFromHTML(pages) {
      this.loadedPages = pages;
    }

    getCurrentPageIndex() {
      return this.current;
    }

    getPageCount() {
      return this.pageCount;
    }

    flipPrev(corner) {
      this.prevCalls.push(corner);
    }

    flipNext(corner) {
      this.nextCalls.push(corner);
    }

    destroy() {
      this.destroyed = true;
    }
  }

  const makeFixture = ({ width = 1200 } = {}) => {
    const root = new FakeHTMLElement();
    root.width = width;
    const book = new FakeHTMLElement();
    const pages = Array.from({ length: 6 }, () => new FakeHTMLElement());
    book.queryMany.set(".page-flip__page", pages);
    const prev = new FakeButton();
    const next = new FakeButton();
    const count = new FakeHTMLElement();
    root.queryOne.set("[data-page-flip-book]", book);
    root.queryOne.set("[data-page-flip-prev]", prev);
    root.queryOne.set("[data-page-flip-next]", next);
    root.queryOne.set("[data-page-flip-count]", count);
    return { root, book, pages, prev, next, count };
  };

  const { PAGE_FLIP_SRC, createPageFlip } = await import(`../src/components/page-flip.ts?test=${Date.now()}`);
  assert.equal(PAGE_FLIP_SRC, "https://unpkg.com/page-flip@2.0.7/dist/js/page-flip.browser.js");

  const invalidDestroy = createPageFlip({});
  assert.equal(typeof invalidDestroy, "function");
  invalidDestroy();

  window.St = { PageFlip: FakePageFlip };
  const fixture = makeFixture();
  const destroy = createPageFlip(fixture.root, { motion: { allowsMotion: () => true } });
  assert.deepEqual(latestObserver.options, { rootMargin: "100% 0px", threshold: 0.01 });
  assert.deepEqual(latestObserver.observed, [fixture.root]);
  assert.equal(instances.length, 0);

  latestObserver.trigger([{ target: fixture.root, isIntersecting: false }]);
  await flush();
  assert.equal(instances.length, 0);

  latestObserver.trigger([{ target: fixture.root, isIntersecting: true }]);
  await flush();
  assert.equal(instances.length, 1);

  const instance = instances[0];
  assert.equal(latestObserver.disconnected, true);
  assert.equal(instance.book, fixture.book);
  assert.equal(instance.loadedPages, fixture.pages);
  assert.deepEqual(instance.options, {
    width: 550,
    height: 778,
    size: "stretch",
    minWidth: 260,
    maxWidth: 580,
    minHeight: 368,
    maxHeight: 820,
    drawShadow: true,
    flippingTime: 1180,
    usePortrait: true,
    startZIndex: 0,
    startPage: 0,
    autoSize: true,
    maxShadowOpacity: 0.18,
    showCover: false,
    mobileScrollSupport: false,
    swipeDistance: 8,
    clickEventForward: false,
    useMouseEvents: true,
    showPageCorners: true,
    disableFlipByClick: false,
  });
  assert.equal(fixture.count.textContent, "01 / 03");
  assert.equal(fixture.prev.disabled, true);
  assert.equal(fixture.next.disabled, false);

  instance.current = 4;
  instance.emit("flip", { data: 4 });
  assert.equal(fixture.count.textContent, "03 / 03");
  assert.equal(fixture.prev.disabled, false);
  assert.equal(fixture.next.disabled, true);

  instance.current = 1;
  instance.emit("changeOrientation", { data: "portrait" });
  assert.equal(fixture.root.dataset.pageFlipOrientation, "portrait");
  assert.equal(fixture.count.textContent, "02 / 06");
  instance.emit("changeOrientation", { data: "unexpected" });
  assert.equal(fixture.root.dataset.pageFlipOrientation, "landscape");
  assert.equal(fixture.count.textContent, "01 / 03");

  fixture.prev.dispatchEvent(new Event("click"));
  fixture.next.dispatchEvent(new Event("click"));
  assert.deepEqual(instance.prevCalls, ["bottom"]);
  assert.deepEqual(instance.nextCalls, ["bottom"]);

  destroy();
  assert.equal(instance.destroyed, true);

  const reduced = makeFixture({ width: 700 });
  latestObserver = null;
  createPageFlip(reduced.root, { motion: { allowsMotion: () => false } });
  latestObserver.trigger([{ target: reduced.root, isIntersecting: true }]);
  await flush();
  assert.equal(instances.at(-1).options.drawShadow, false);
  assert.equal(instances.at(-1).options.flippingTime, 0);

  window.St = undefined;
  latestObserver = null;
  const loaderFixture = makeFixture();
  createPageFlip(loaderFixture.root);
  latestObserver.trigger([{ target: loaderFixture.root, isIntersecting: true }]);
  await flush();
  assert.equal(scriptNodes.length, 1);
  const script = scriptNodes[0];
  assert.equal(script.src, PAGE_FLIP_SRC);
  assert.equal(script.async, true);
  assert.equal(Object.hasOwn(script.dataset, "pageFlipLibrary"), true);

  window.St = { PageFlip: FakePageFlip };
  script.dispatchEvent(new Event("load"));
  await flush();
  assert.equal(instances.at(-1).book, loaderFixture.book);
});
