import { chromium } from "playwright";

const imageDecodeBudgetMs = 10_000;
const originalLaunch = chromium.launch.bind(chromium);

chromium.launch = async (...args) => {
  const browser = await originalLaunch(...args);
  const originalNewContext = browser.newContext.bind(browser);

  browser.newContext = async (...contextArgs) => {
    const context = await originalNewContext(...contextArgs);
    await context.addInitScript((decodeBudgetMs) => {
      const originalDecode = HTMLImageElement.prototype.decode;
      if (typeof originalDecode !== "function") return;

      HTMLImageElement.prototype.decode = function boundedDecode() {
        const decode = originalDecode.call(this);
        let timer = 0;
        const timeout = new Promise((resolve) => {
          timer = window.setTimeout(resolve, decodeBudgetMs);
        });
        return Promise.race([decode, timeout]).finally(() => {
          if (timer) window.clearTimeout(timer);
        });
      };
    }, imageDecodeBudgetMs);
    return context;
  };

  return browser;
};

await import("./tmp-css-regression-audit.mjs");
