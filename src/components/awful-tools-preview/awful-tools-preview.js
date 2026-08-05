import { getPetPreviewOverride } from "./awful-tools-preview-pets.js";

const TAG_NAME = "awful-tool-preview";

const PROJECTS = Object.freeze({
  "awful-cases": {
    label: "Awful Cases",
    marker: /Awful\s*Cases/i,
    localPaths: [
      "pets/awful-cases/index.html",
      "/pets/awful-cases/index.html",
    ],
    remotePaths: [
      "https://raw.githubusercontent.com/looksawful/awful-cases/main/docs/index.html",
    ],
  },
  "berserk-timer": {
    label: "Berserk Timer",
    marker: /Berserk\s*Timer/i,
    localPaths: [
      "pets/berserk-timer/index.html",
      "/pets/berserk-timer/index.html",
    ],
    remotePaths: [
      "https://raw.githubusercontent.com/looksawful/berserk-timer/dev/docs/index.html",
      "https://raw.githubusercontent.com/looksawful/berserk-timer/main/docs/index.html",
    ],
  },
  "awful-audit": {
    label: "Awful Audit",
    marker: /Awful\s*Audit/i,
    localPaths: [
      "pets/awful-audit/index.html",
      "/pets/awful-audit/index.html",
    ],
    remotePaths: [
      "https://raw.githubusercontent.com/looksawful/awful-audit/main/docs/index.html",
    ],
  },
});

const HOST_STYLE = `
  :host {
    display: block;
    inline-size: 100%;
    min-inline-size: 0;
    overflow: clip;
    contain: layout paint style;
    isolation: isolate;
  }

  :host([hidden]) {
    display: none;
  }

  [data-source-html] {
    display: block;
    inline-size: 100%;
    min-inline-size: 0;
  }

  [data-inline-document] {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    min-inline-size: 0;
    min-block-size: 0;
    overflow: hidden;
    contain: layout paint style;
    transform: translateZ(0);
  }
`;

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function resolveCandidateUrl(path) {
  try {
    return new URL(path, document.baseURI).href;
  } catch {
    return null;
  }
}

function getProjectConfig(project) {
  const baseConfig = PROJECTS[project] ?? PROJECTS["awful-cases"];
  const petOverride = getPetPreviewOverride(project);

  if (!petOverride) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...petOverride,
    localPaths: petOverride.localPaths ?? baseConfig.localPaths,
    remotePaths: petOverride.remotePaths ?? baseConfig.remotePaths,
    bridgeStyle: petOverride.bridgeStyle ?? "",
    useInlineSource: petOverride.useInlineSource ?? true,
  };
}

function getSourceCandidates(config) {
  return unique([
    ...config.localPaths.map(resolveCandidateUrl),
    ...config.remotePaths,
  ]);
}

async function fetchSource(config, signal) {
  const failures = [];

  for (const url of getSourceCandidates(config)) {
    try {
      const response = await fetch(url, {
        cache: "no-cache",
        credentials: "same-origin",
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const source = await response.text();

      if (!config.marker.test(source)) {
        throw new Error("unexpected source document");
      }

      return { source, url };
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      failures.push(`${url}: ${error.message}`);
    }
  }

  throw new Error(
    `Не удалось загрузить ${config.label}. ${failures.join(" | ")}`,
  );
}

function absolutizeUrl(value, baseUrl) {
  if (!value || /^(?:[a-z]+:|#|\/\/)/i.test(value)) {
    return value;
  }

  try {
    return new URL(value, baseUrl).href;
  } catch {
    return value;
  }
}

function absolutizeSrcset(value, baseUrl) {
  return value
    .split(",")
    .map((candidate) => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/);
      return [absolutizeUrl(url, baseUrl), ...descriptor].join(" ");
    })
    .join(", ");
}

function absolutizeCss(cssText, baseUrl) {
  return cssText
    .replace(
      /url\(\s*(["']?)(?!data:|blob:|https?:|\/\/|#)([^"')]+)\1\s*\)/gi,
      (_match, quote, value) =>
        `url(${quote}${absolutizeUrl(value.trim(), baseUrl)}${quote})`,
    )
    .replace(
      /@import\s+(["'])(?!data:|https?:|\/\/)([^"']+)\1/gi,
      (_match, quote, value) =>
        `@import ${quote}${absolutizeUrl(value.trim(), baseUrl)}${quote}`,
    );
}

function absolutizeDocument(documentNode, baseUrl) {
  const urlAttributes = ["src", "href", "poster", "action"];

  documentNode.querySelectorAll("*").forEach((element) => {
    urlAttributes.forEach((attribute) => {
      if (!element.hasAttribute(attribute)) {
        return;
      }

      element.setAttribute(
        attribute,
        absolutizeUrl(element.getAttribute(attribute), baseUrl),
      );
    });

    if (element.hasAttribute("srcset")) {
      element.setAttribute(
        "srcset",
        absolutizeSrcset(element.getAttribute("srcset"), baseUrl),
      );
    }

    if (element.hasAttribute("style")) {
      element.setAttribute(
        "style",
        absolutizeCss(element.getAttribute("style"), baseUrl),
      );
    }
  });

  documentNode.querySelectorAll("style").forEach((style) => {
    style.textContent = absolutizeCss(style.textContent, baseUrl);
  });
}

function extractRootDeclarations(styleTexts) {
  const declarations = [];

  styleTexts.forEach((cssText) => {
    const expression = /:root\s*\{([^{}]*)\}/gi;
    let match = expression.exec(cssText);

    while (match) {
      declarations.push(match[1].trim());
      match = expression.exec(cssText);
    }
  });

  return declarations.join("\n");
}

function decodeDataHtml(value) {
  const separator = value.indexOf(",");

  if (separator < 0) {
    return "";
  }

  const metadata = value.slice(0, separator);
  const payload = value.slice(separator + 1);

  if (/;base64/i.test(metadata)) {
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0),
    );

    return new TextDecoder().decode(bytes);
  }

  return decodeURIComponent(payload);
}

function prepareInlineDocuments(parsedDocument, sourceUrl) {
  const inlineDocuments = [];

  parsedDocument
    .querySelectorAll("template[data-inline-document-source]")
    .forEach((template, index) => {
      const key =
        template.getAttribute("data-inline-document-source") ||
        `inline-document-${index}`;

      inlineDocuments.push({
        key,
        source: template.content.textContent.trim(),
        url: sourceUrl,
      });

      template.remove();
    });

  parsedDocument.querySelectorAll("iframe").forEach((frame, index) => {
    const source = frame.getAttribute("src") ?? "";
    let inlineSource = "";

    if (/^data:text\/html/i.test(source)) {
      inlineSource = decodeDataHtml(source);
    }

    const replacement = parsedDocument.createElement("div");
    const key = `inline-document-${index}`;

    [...frame.attributes].forEach(({ name, value }) => {
      if (name !== "src" && name !== "allow" && name !== "allowfullscreen") {
        replacement.setAttribute(name, value);
      }
    });

    replacement.setAttribute("data-inline-document", key);
    replacement.setAttribute("role", "group");

    frame.replaceWith(replacement);

    if (inlineSource) {
      inlineDocuments.push({
        key,
        source: inlineSource,
        url: sourceUrl,
      });
    }
  });

  return inlineDocuments;
}

function getInlineSource(host, config) {
  if (config.useInlineSource === false) {
    return null;
  }

  const template = host.querySelector("template[data-awful-tool-source]");

  if (!template) {
    return null;
  }

  return {
    source: template.content.textContent.trim(),
    url: document.baseURI,
  };
}

function createRuntime({ shadowRoot, sourceHtml, sourceHead, sourceBody, host }) {
  const cleanupCallbacks = [];
  const timeoutIds = new Set();
  const intervalIds = new Set();
  const animationFrameIds = new Set();
  const localWindowState = Object.create(null);

  const querySelector = (selector) => {
    if (selector === ":root") {
      return sourceHtml;
    }

    return shadowRoot.querySelector(selector);
  };

  const querySelectorAll = (selector) => shadowRoot.querySelectorAll(selector);

  const addDocumentListener = (type, listener, options) => {
    if (type === "DOMContentLoaded") {
      queueMicrotask(() => listener.call(scopedDocument, new Event(type)));
      return;
    }

    const globalDocumentEvents = new Set([
      "visibilitychange",
      "fullscreenchange",
      "pointerlockchange",
    ]);
    const target = globalDocumentEvents.has(type) ? document : shadowRoot;

    target.addEventListener(type, listener, options);
    cleanupCallbacks.push(() =>
      target.removeEventListener(type, listener, options),
    );
  };

  const addWindowListener = (type, listener, options) => {
    if (type === "load") {
      queueMicrotask(() => listener.call(scopedWindow, new Event(type)));
      return;
    }

    window.addEventListener(type, listener, options);
    cleanupCallbacks.push(() =>
      window.removeEventListener(type, listener, options),
    );
  };

  const scopedDocumentTarget = {
    body: sourceBody,
    head: sourceHead,
    documentElement: sourceHtml,
    defaultView: null,
    readyState: "complete",
    URL: sourceHtml.dataset.sourceUrl,
    baseURI: sourceHtml.dataset.sourceUrl,
    title: sourceHead.querySelector("title")?.textContent ?? "",
    querySelector,
    querySelectorAll,
    getElementById: (id) =>
      shadowRoot.querySelector(`#${CSS.escape(String(id))}`),
    getElementsByClassName: (className) =>
      shadowRoot.querySelectorAll(`.${CSS.escape(String(className))}`),
    getElementsByTagName: (tagName) =>
      shadowRoot.querySelectorAll(String(tagName)),
    getElementsByName: (name) =>
      shadowRoot.querySelectorAll(`[name="${CSS.escape(String(name))}"]`),
    createElement: document.createElement.bind(document),
    createElementNS: document.createElementNS.bind(document),
    createTextNode: document.createTextNode.bind(document),
    createDocumentFragment: document.createDocumentFragment.bind(document),
    importNode: document.importNode.bind(document),
    addEventListener: addDocumentListener,
    removeEventListener: shadowRoot.removeEventListener.bind(shadowRoot),
    dispatchEvent: shadowRoot.dispatchEvent.bind(shadowRoot),
    getSelection: document.getSelection.bind(document),
    hasFocus: document.hasFocus.bind(document),
    fonts: document.fonts,
    visibilityState: document.visibilityState,
  };

  const scopedDocument = new Proxy(scopedDocumentTarget, {
    get(target, property) {
      if (property === "activeElement") {
        return shadowRoot.activeElement;
      }

      if (property in target) {
        return target[property];
      }

      const value = document[property];
      return typeof value === "function" ? value.bind(document) : value;
    },
    set(target, property, value) {
      target[property] = value;
      return true;
    },
    has(target, property) {
      return property in target || property in document;
    },
  });

  const scopedWindowTarget = {
    document: scopedDocument,
    self: null,
    top: null,
    parent: null,
    frames: null,
    get innerWidth() {
      return Math.max(1, Math.round(host.getBoundingClientRect().width));
    },
    get innerHeight() {
      return Math.max(1, Math.round(host.getBoundingClientRect().height));
    },
    get scrollX() {
      return 0;
    },
    get scrollY() {
      return 0;
    },
    addEventListener: addWindowListener,
    removeEventListener: window.removeEventListener.bind(window),
    dispatchEvent: window.dispatchEvent.bind(window),
    requestAnimationFrame(callback) {
      const scheduledAt = window.performance.now();
      const id = window.requestAnimationFrame((time) => {
        animationFrameIds.delete(id);
        callback(Math.max(time, scheduledAt));
      });
      animationFrameIds.add(id);
      return id;
    },
    cancelAnimationFrame(id) {
      animationFrameIds.delete(id);
      window.cancelAnimationFrame(id);
    },
    setTimeout(callback, delay, ...argumentsList) {
      const id = window.setTimeout(() => {
        timeoutIds.delete(id);
        callback(...argumentsList);
      }, delay);
      timeoutIds.add(id);
      return id;
    },
    clearTimeout(id) {
      timeoutIds.delete(id);
      window.clearTimeout(id);
    },
    setInterval(callback, delay, ...argumentsList) {
      const id = window.setInterval(callback, delay, ...argumentsList);
      intervalIds.add(id);
      return id;
    },
    clearInterval(id) {
      intervalIds.delete(id);
      window.clearInterval(id);
    },
    scrollTo() {},
    scrollBy() {},
  };

  const scopedWindow = new Proxy(scopedWindowTarget, {
    get(target, property) {
      if (property === "self" || property === "top" || property === "parent") {
        return scopedWindow;
      }

      if (property === "frames") {
        return scopedWindow;
      }

      if (property === Symbol.unscopables) {
        return undefined;
      }

      if (property in localWindowState) {
        return localWindowState[property];
      }

      if (property in target) {
        return target[property];
      }

      const value = window[property];
      if (typeof value !== "function") {
        return value;
      }

      return /^[A-Z]/.test(String(property)) ? value : value.bind(window);
    },
    set(_target, property, value) {
      localWindowState[property] = value;
      return true;
    },
    has(target, property) {
      return (
        property in localWindowState ||
        property in target ||
        property in window
      );
    },
  });

  scopedDocumentTarget.defaultView = scopedWindow;

  return {
    document: scopedDocument,
    window: scopedWindow,
    destroy() {
      cleanupCallbacks.splice(0).reverse().forEach((cleanup) => cleanup());
      timeoutIds.forEach((id) => window.clearTimeout(id));
      intervalIds.forEach((id) => window.clearInterval(id));
      animationFrameIds.forEach((id) => window.cancelAnimationFrame(id));
      timeoutIds.clear();
      intervalIds.clear();
      animationFrameIds.clear();
    },
  };
}

async function getScriptSource(script, baseUrl, signal) {
  const source = script.getAttribute("src");

  if (!source) {
    return script.textContent;
  }

  const url = absolutizeUrl(source, baseUrl);
  const response = await fetch(url, {
    cache: "no-cache",
    credentials: "same-origin",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Не удалось загрузить script: ${url}`);
  }

  return response.text();
}

function executeScript(source, runtime, sourceLabel) {
  if (!source.trim()) {
    return;
  }

  const runner = new Function(
    "document",
    "window",
    "self",
    "globalThis",
    `with (window) {\n${source}\n}\n//# sourceURL=${sourceLabel}`,
  );

  runner.call(
    runtime.window,
    runtime.document,
    runtime.window,
    runtime.window,
    runtime.window,
  );
}

async function mountSourceDocument({
  source,
  sourceUrl,
  mountRoot,
  host,
  signal,
  embedded = false,
  bridgeStyle = "",
}) {
  const parsedDocument = new DOMParser().parseFromString(source, "text/html");
  absolutizeDocument(parsedDocument, sourceUrl);

  const inlineDocuments = prepareInlineDocuments(parsedDocument, sourceUrl);
  const scripts = [...parsedDocument.querySelectorAll("script")];
  scripts.forEach((script) => script.remove());

  const sourceHtml = document.createElement("html");
  const sourceHead = document.createElement("head");
  const sourceBody = document.createElement("body");

  [...parsedDocument.documentElement.attributes].forEach(({ name, value }) => {
    sourceHtml.setAttribute(name, value);
  });

  [...parsedDocument.body.attributes].forEach(({ name, value }) => {
    sourceBody.setAttribute(name, value);
  });

  sourceHtml.dataset.sourceHtml = "";
  sourceHtml.dataset.sourceUrl = sourceUrl;
  sourceHead.dataset.sourceHead = "";
  sourceBody.dataset.sourceBody = "";
  sourceBody.append(...[...parsedDocument.body.childNodes].map((node) => node.cloneNode(true)));

  const title = parsedDocument.querySelector("title")?.cloneNode(true);
  if (title) {
    sourceHead.append(title);
  }

  const styleTexts = [];

  parsedDocument.head
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach((node) => {
      const clone = node.cloneNode(true);

      if (clone.tagName === "STYLE") {
        let cssText = clone.textContent;

        if (embedded) {
          cssText = cssText
            .replace(/100d?vw\b/gi, "100%")
            .replace(/100s?vw\b/gi, "100%")
            .replace(/100d?vh\b/gi, "100%")
            .replace(/100s?vh\b/gi, "100%");
          clone.textContent = cssText;
        }

        styleTexts.push(cssText);
      }

      sourceHead.append(clone);
    });

  const bridge = document.createElement("style");
  const rootDeclarations = extractRootDeclarations(styleTexts);
  bridge.textContent = `${HOST_STYLE}\n:host { ${rootDeclarations} }\n${bridgeStyle}`;
  sourceHead.prepend(bridge);

  sourceHtml.append(sourceHead, sourceBody);
  mountRoot.append(sourceHtml);

  const runtime = createRuntime({
    shadowRoot: mountRoot,
    sourceHtml,
    sourceHead,
    sourceBody,
    host,
  });

  for (const script of scripts) {
    if (script.type && !/^(?:text\/javascript|application\/javascript|module)$/i.test(script.type)) {
      continue;
    }

    const scriptSource = await getScriptSource(script, sourceUrl, signal);
    executeScript(
      scriptSource,
      runtime,
      `${sourceUrl}#script-${scripts.indexOf(script) + 1}`,
    );
  }

  for (const inlineDocument of inlineDocuments) {
    const target = mountRoot.querySelector(
      `[data-inline-document="${CSS.escape(inlineDocument.key)}"]`,
    );

    if (!target) {
      continue;
    }

    const nestedRoot = target.attachShadow({ mode: "open" });
    const nestedRuntime = await mountSourceDocument({
      source: inlineDocument.source,
      sourceUrl: inlineDocument.url,
      mountRoot: nestedRoot,
      host: target,
      signal,
      embedded: true,
    });

    runtime.window.setTimeout(() => {
      target.dispatchEvent(new Event("resize"));
    }, 0);

    const parentDestroy = runtime.destroy.bind(runtime);
    runtime.destroy = () => {
      nestedRuntime.destroy();
      parentDestroy();
    };
  }

  return runtime;
}

class AwfulToolPreview extends HTMLElement {
  #abortController = null;
  #runtime = null;

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this.load();
  }

  disconnectedCallback() {
    this.#abortController?.abort();
    this.#abortController = null;
    this.#runtime?.destroy();
    this.#runtime = null;
  }

  async load() {
    this.#abortController?.abort();
    this.#runtime?.destroy();
    this.#runtime = null;

    const project = this.getAttribute("project") || "awful-cases";
    const config = getProjectConfig(project);
    const controller = new AbortController();
    this.#abortController = controller;
    this.setAttribute("aria-busy", "true");
    this.shadowRoot.replaceChildren();

    try {
      const { source, url } =
        getInlineSource(this, config) ??
        (await fetchSource(config, controller.signal));

      if (controller.signal.aborted) {
        return;
      }

      this.#runtime = await mountSourceDocument({
        source,
        sourceUrl: url,
        mountRoot: this.shadowRoot,
        host: this,
        signal: controller.signal,
        bridgeStyle: config.bridgeStyle,
      });

      this.dataset.source = url;
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(`[${TAG_NAME}]`, error);
      }
    } finally {
      if (!controller.signal.aborted) {
        this.removeAttribute("aria-busy");
      }
    }
  }
}

if (!customElements.get(TAG_NAME)) {
  customElements.define(TAG_NAME, AwfulToolPreview);
}

export { AwfulToolPreview };
