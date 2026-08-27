import assert from "node:assert/strict";
import test from "node:test";

import { initProjectNavigationBackToTop } from "../src/components/project-navigation.ts";

class FakeElement {
  constructor(ownerDocument = null) {
    this.ownerDocument = ownerDocument;
    this.id = "";
    this.className = "";
    this.textContent = "";
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.queries = new Map();
  }

  querySelector(selector) {
    if (selector === ".project-nav__top") {
      return this.children.find((child) => child.className === "project-nav__top") ?? null;
    }

    return this.queries.get(selector) ?? null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
    if (name === "id") this.id = "";
  }

  append(...children) {
    children.forEach((child) => {
      child.parentElement = this;
      this.children.push(child);
    });
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(
      (child) => child !== this,
    );
    this.parentElement = null;
  }
}

class FakeDocument {
  constructor() {
    this.hero = new FakeElement(this);
    this.inner = new FakeElement(this);
    this.navigation = new FakeElement(this);
    this.navigation.queries.set(".project-nav__inner", this.inner);
  }

  querySelector(selector) {
    if (selector === "[data-projects-navigation]") return this.navigation;
    if (selector === ".hero") return this.hero;
    return null;
  }

  getElementById(id) {
    return this.hero.id === id ? this.hero : null;
  }

  createElement() {
    return new FakeElement(this);
  }
}

test("back-to-top is created once as a native hash link and cleanup restores the DOM", () => {
  const previousHTMLElement = globalThis.HTMLElement;
  globalThis.HTMLElement = FakeElement;

  try {
    const root = new FakeDocument();
    const destroy = initProjectNavigationBackToTop(root);

    assert.equal(root.hero.id, "top");
    assert.equal(root.inner.children.length, 1);

    const link = root.inner.children[0];
    assert.equal(link.className, "project-nav__top");
    assert.equal(link.getAttribute("href"), "#top");
    assert.equal(link.getAttribute("aria-label"), "Наверх");
    assert.equal(link.children.length, 2);
    assert.equal(link.children[0].textContent, "↑");
    assert.equal(link.children[0].getAttribute("aria-hidden"), "true");
    assert.equal(link.children[1].className, "project-nav__top-label");
    assert.equal(link.children[1].textContent, "Наверх");

    const destroyDuplicate = initProjectNavigationBackToTop(root);
    assert.equal(root.inner.children.length, 1);
    destroyDuplicate();
    assert.equal(root.inner.children.length, 1);

    destroy();
    assert.equal(root.inner.children.length, 0);
    assert.equal(root.hero.id, "");
  } finally {
    globalThis.HTMLElement = previousHTMLElement;
  }
});