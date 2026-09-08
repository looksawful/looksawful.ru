import assert from "node:assert/strict";
import test from "node:test";

import { initProjectNavigationDock } from "../src/components/project-navigation.ts";

class FakeElement {
  constructor() {
    this.attributes = new Map();
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

function installDomGlobals() {
  const previous = {
    HTMLElement: globalThis.HTMLElement,
    IntersectionObserver: globalThis.IntersectionObserver,
  };

  globalThis.HTMLElement = FakeElement;
  globalThis.IntersectionObserver = FakeIntersectionObserver;

  return () => {
    Object.assign(globalThis, previous);
    FakeIntersectionObserver.instances.length = 0;
  };
}

function createFixture() {
  const projects = new FakeElement();
  const navigation = new FakeElement();
  const inner = new FakeElement();

  inner.inert = false;
  navigation.querySelector = (selector) =>
    selector === ".project-nav__inner" ? inner : null;

  const root = {
    querySelector(selector) {
      if (selector === "[data-projects-navigation]") return navigation;
      if (selector === ".projects") return projects;
      return null;
    },
  };

  return { root, projects, navigation, inner };
}

test("project navigation dock uses one presence observer and no coordinate writes", () => {
  const restore = installDomGlobals();

  try {
    const { root, projects, navigation, inner } = createFixture();
    const destroy = initProjectNavigationDock(root);

    assert.equal(FakeIntersectionObserver.instances.length, 1);
    const observer = FakeIntersectionObserver.instances[0];

    assert.deepEqual(observer.options, { root: null, threshold: 0 });
    assert.deepEqual(observer.observed, [projects]);
    assert.equal(navigation.hasAttribute("data-project-nav-enhanced"), true);
    assert.equal(navigation.hasAttribute("data-project-nav-docked"), false);
    assert.equal(inner.inert, true);
    assert.equal(inner.getAttribute("aria-hidden"), "true");

    observer.emit([{ target: projects, isIntersecting: true }]);

    assert.equal(navigation.hasAttribute("data-project-nav-docked"), true);
    assert.equal(inner.inert, false);
    assert.equal(inner.getAttribute("aria-hidden"), null);

    observer.emit([{ target: projects, isIntersecting: false }]);

    assert.equal(navigation.hasAttribute("data-project-nav-docked"), false);
    assert.equal(inner.inert, true);
    assert.equal(inner.getAttribute("aria-hidden"), "true");

    destroy();

    assert.equal(observer.disconnected, true);
    assert.equal(navigation.hasAttribute("data-project-nav-enhanced"), false);
    assert.equal(navigation.hasAttribute("data-project-nav-docked"), false);
    assert.equal(inner.inert, false);
    assert.equal(inner.getAttribute("aria-hidden"), null);
  } finally {
    restore();
  }
});
