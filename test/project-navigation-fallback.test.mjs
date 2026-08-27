import assert from "node:assert/strict";
import test from "node:test";

import { initSiteInteractive } from "../src/interactive.js";

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.hidden = false;
    this.attributes = new Map();
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }
}

class FakeAnchorElement extends FakeElement {
  constructor(hash, ownerDocument) {
    super();
    this.hash = hash;
    this.ownerDocument = ownerDocument;
  }
}

class FakeIntersectionObserver {
  static instances = [];

  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = [];
    this.disconnected = false;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target) {
    this.observed.push(target);
  }

  disconnect() {
    this.disconnected = true;
  }

  emit(entries) {
    this.callback(entries, this);
  }
}

function createFixture() {
  const projects = [
    new FakeElement("project-jestei"),
    new FakeElement("project-styx"),
    new FakeElement("project-sensetique"),
    new FakeElement("project-shootings"),
  ];

  const byId = new Map(projects.map((project) => [project.id, project]));
  const root = {
    querySelector(selector) {
      return selector === "[data-projects-navigation]" ? navigation : null;
    },
    querySelectorAll() {
      return [];
    },
    getElementById(id) {
      return byId.get(id) ?? null;
    },
  };

  const links = projects.map(
    (project) => new FakeAnchorElement(`#${project.id}`, root),
  );

  const list = new FakeElement();
  list.scrollWidth = 900;
  list.clientWidth = 320;
  list.scrollLeft = 0;
  list.scrollCalls = [];
  list.getBoundingClientRect = () => ({ left: 0, width: 320 });
  list.scrollTo = (options) => list.scrollCalls.push(options);

  links.forEach((link, index) => {
    link.getBoundingClientRect = () => ({ left: index * 180, width: 140 });
  });

  const navigation = new FakeElement();
  navigation.querySelector = (selector) =>
    selector === ".project-nav__list" ? list : null;
  navigation.querySelectorAll = (selector) =>
    selector === 'a[href^="#"]' ? links : [];

  return { root, projects, links, list };
}

function installDomGlobals({ nativeSupport }) {
  const previous = {
    CSS: globalThis.CSS,
    HTMLElement: globalThis.HTMLElement,
    HTMLAnchorElement: globalThis.HTMLAnchorElement,
    IntersectionObserver: globalThis.IntersectionObserver,
    window: globalThis.window,
  };

  const windowEvents = [];

  globalThis.HTMLElement = FakeElement;
  globalThis.HTMLAnchorElement = FakeAnchorElement;
  globalThis.IntersectionObserver = FakeIntersectionObserver;
  globalThis.CSS = {
    supports(query) {
      if (query === "scroll-target-group: auto") return nativeSupport;
      if (query === "selector(:target-current)") return nativeSupport;
      return false;
    },
  };
  globalThis.window = {
    addEventListener(type) {
      windowEvents.push(type);
    },
    removeEventListener() {},
  };

  return {
    windowEvents,
    restore() {
      Object.assign(globalThis, previous);
      FakeIntersectionObserver.instances.length = 0;
    },
  };
}

test("unsupported browsers use one IntersectionObserver and update aria-current without scroll listeners", () => {
  const globals = installDomGlobals({ nativeSupport: false });

  try {
    const { root, projects, links, list } = createFixture();
    const destroy = initSiteInteractive({ root });

    assert.equal(FakeIntersectionObserver.instances.length, 1);

    const observer = FakeIntersectionObserver.instances[0];
    assert.deepEqual(observer.options, {
      root: null,
      rootMargin: "-20% 0px -79% 0px",
      threshold: 0,
    });
    assert.deepEqual(observer.observed, projects);
    assert.equal(globals.windowEvents.includes("scroll"), false);

    observer.emit([
      { target: projects[1], isIntersecting: true },
    ]);

    assert.equal(links[1].getAttribute("aria-current"), "location");
    assert.equal(links[0].getAttribute("aria-current"), null);
    assert.equal(links[2].getAttribute("aria-current"), null);
    assert.equal(links[3].getAttribute("aria-current"), null);
    assert.equal(list.scrollCalls.length, 1);

    destroy();
    assert.equal(observer.disconnected, true);
  } finally {
    globals.restore();
  }
});

test("browsers with native CSS project navigation create no JS observer", () => {
  const globals = installDomGlobals({ nativeSupport: true });

  try {
    const { root } = createFixture();
    const destroy = initSiteInteractive({ root });

    assert.equal(FakeIntersectionObserver.instances.length, 0);
    assert.equal(globals.windowEvents.includes("scroll"), false);

    destroy();
  } finally {
    globals.restore();
  }
});
