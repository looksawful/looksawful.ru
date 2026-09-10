import assert from "node:assert/strict";
import test from "node:test";

import { initSiteInteractive } from "../src/interactive.ts";

class FakeElement {
  constructor(id = "") {
    this.id = id;
    this.hidden = false;
    this.attributes = new Map();
    this.inert = false;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }
}

class FakeAnchorElement extends FakeElement {
  constructor(hash, ownerDocument = null) {
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
  const projectEntries = [
    new FakeElement("project-jestei"),
    new FakeElement("project-styx"),
    new FakeElement("project-sensetique"),
    new FakeElement("project-shootings"),
  ];
  const projectsCollection = new FakeElement("projects");
  const top = new FakeElement("top");

  const byId = new Map(
    [...projectEntries, top].map((element) => [element.id, element]),
  );

  const links = projectEntries.map(
    (project) => new FakeAnchorElement(`#${project.id}`),
  );
  const backTop = new FakeAnchorElement("#top");

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

  const inner = new FakeElement();
  const navigation = new FakeElement();
  navigation.querySelector = (selector) => {
    if (selector === ".project-nav__inner") return inner;
    if (selector === ".project-nav__list") return list;
    return null;
  };
  navigation.querySelectorAll = (selector) => {
    if (selector === '.project-nav__link[href^="#"]') return links;
    if (selector === 'a[href^="#"]') return [...links, backTop];
    return [];
  };

  const root = {
    querySelector(selector) {
      if (selector === "[data-projects-navigation]") return navigation;
      if (selector === ".projects") return projectsCollection;
      return null;
    },
    querySelectorAll() {
      return [];
    },
    getElementById(id) {
      return byId.get(id) ?? null;
    },
  };

  links.forEach((link) => {
    link.ownerDocument = root;
  });
  backTop.ownerDocument = root;

  return {
    root,
    projectsCollection,
    projectEntries,
    links,
    list,
    backTop,
    navigation,
    inner,
  };
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

test("unsupported browsers use one dock observer plus the active-project fallback without scroll listeners", () => {
  const globals = installDomGlobals({ nativeSupport: false });

  try {
    const {
      root,
      projectsCollection,
      projectEntries,
      links,
      list,
      backTop,
    } = createFixture();
    const destroy = initSiteInteractive({ root });

    assert.equal(FakeIntersectionObserver.instances.length, 2);

    const dockObserver = FakeIntersectionObserver.instances.find(
      (observer) => observer.options?.rootMargin === undefined,
    );
    const activeObserver = FakeIntersectionObserver.instances.find(
      (observer) => observer.options?.rootMargin === "-20% 0px -79% 0px",
    );

    assert.ok(dockObserver);
    assert.deepEqual(dockObserver.options, { root: null, threshold: 0 });
    assert.deepEqual(dockObserver.observed, [projectsCollection]);

    assert.ok(activeObserver);
    assert.deepEqual(activeObserver.options, {
      root: null,
      rootMargin: "-20% 0px -79% 0px",
      threshold: 0,
    });
    assert.deepEqual(activeObserver.observed, projectEntries);
    assert.equal(globals.windowEvents.includes("scroll"), false);

    activeObserver.emit([
      { target: projectEntries[1], isIntersecting: true },
    ]);

    assert.equal(links[1].getAttribute("aria-current"), "location");
    assert.equal(links[0].getAttribute("aria-current"), null);
    assert.equal(links[2].getAttribute("aria-current"), null);
    assert.equal(links[3].getAttribute("aria-current"), null);
    assert.equal(backTop.getAttribute("aria-current"), null);
    assert.equal(list.scrollCalls.length, 1);

    destroy();
    assert.equal(dockObserver.disconnected, true);
    assert.equal(activeObserver.disconnected, true);
  } finally {
    globals.restore();
  }
});

test("native CSS project navigation still uses only the dock presence observer", () => {
  const globals = installDomGlobals({ nativeSupport: true });

  try {
    const { root, projectsCollection } = createFixture();
    const destroy = initSiteInteractive({ root });

    assert.equal(FakeIntersectionObserver.instances.length, 1);
    const observer = FakeIntersectionObserver.instances[0];
    assert.deepEqual(observer.options, { root: null, threshold: 0 });
    assert.deepEqual(observer.observed, [projectsCollection]);
    assert.equal(globals.windowEvents.includes("scroll"), false);

    destroy();
    assert.equal(observer.disconnected, true);
  } finally {
    globals.restore();
  }
});
