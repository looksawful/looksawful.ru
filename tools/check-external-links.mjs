import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  SITE_ORIGIN,
  collectHtmlFiles,
  extractReferenceAttributes,
  readUtf8,
} from "./site-html-utils.mjs";

const CONCURRENCY = 5;
const TIMEOUT_MS = 10_000;

function classifyStatus(status, redirected) {
  if (status >= 200 && status < 300) return { classification: redirected ? "redirect" : "ok", severity: "ok" };
  if (status >= 300 && status < 400) return { classification: "redirect", severity: "ok" };
  if (status === 404 || status === 410) return { classification: "broken", severity: "broken" };
  if (status === 401 || status === 403 || status === 429 || status >= 500) return { classification: "warning", severity: "warning" };
  return { classification: "warning", severity: "warning" };
}

async function request(url, method) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: method === "GET" ? { Range: "bytes=0-0", "User-Agent": "looksawful-link-check/1.0" } : { "User-Agent": "looksawful-link-check/1.0" },
    });
    await response.body?.cancel().catch(() => {});
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkUrl(url) {
  const startedAt = Date.now();
  try {
    let response = await request(url, "HEAD");
    let method = "HEAD";
    if (response.status === 405 || response.status === 501) {
      response = await request(url, "GET");
      method = "GET";
    }
    const result = classifyStatus(response.status, response.redirected);
    return {
      url,
      method,
      status: response.status,
      finalUrl: response.url,
      redirected: response.redirected,
      classification: result.classification,
      severity: result.severity,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "Error";
    const message = error instanceof Error ? error.message : String(error);
    const timeout = name === "AbortError" || /aborted|timeout/i.test(message);
    return {
      url,
      method: "HEAD",
      status: null,
      finalUrl: null,
      redirected: false,
      classification: timeout ? "timeout" : "network-error",
      severity: "warning",
      error: `${name}: ${message}`,
      durationMs: Date.now() - startedAt,
    };
  }
}

async function collectExternalHrefs(distDir) {
  const files = await collectHtmlFiles(distDir);
  const urls = new Set();
  for (const file of files) {
    const html = await readUtf8(file);
    for (const reference of extractReferenceAttributes(html)) {
      if (reference.attribute !== "href" || !/^https?:\/\//i.test(reference.url)) continue;
      let parsed;
      try { parsed = new URL(reference.url); } catch { continue; }
      if (parsed.origin === SITE_ORIGIN) continue;
      urls.add(parsed.href);
    }
  }
  return [...urls].sort((a, b) => a.localeCompare(b));
}

async function mapConcurrent(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runWorker() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, runWorker));
  return results;
}

function renderMarkdown(report) {
  const lines = [
    "# External link report",
    "",
    `Generated: ${report.generatedAt}`,
    `Total: ${report.summary.total} · OK: ${report.summary.ok} · warnings: ${report.summary.warnings} · broken: ${report.summary.broken}`,
    "",
    "| Status | HTTP | URL | Final URL / error |",
    "| --- | ---: | --- | --- |",
  ];
  for (const item of report.results) {
    const detail = item.error ?? (item.finalUrl && item.finalUrl !== item.url ? item.finalUrl : "");
    lines.push(`| ${item.classification} | ${item.status ?? "—"} | ${item.url.replaceAll("|", "\\|")} | ${String(detail).replaceAll("|", "\\|")} |`);
  }
  lines.push("");
  return lines.join("\n");
}

export async function checkExternalLinks({ distDir = "dist", outputDir = "artifacts/external-links" } = {}) {
  const absoluteDist = path.resolve(distDir);
  const urls = await collectExternalHrefs(absoluteDist);
  const results = await mapConcurrent(urls, CONCURRENCY, checkUrl);
  const summary = {
    total: results.length,
    ok: results.filter((item) => item.severity === "ok").length,
    warnings: results.filter((item) => item.severity === "warning").length,
    broken: results.filter((item) => item.severity === "broken").length,
  };
  const report = { generatedAt: new Date().toISOString(), concurrency: CONCURRENCY, timeoutMs: TIMEOUT_MS, summary, results };
  const absoluteOutput = path.resolve(outputDir);
  await mkdir(absoluteOutput, { recursive: true });
  await writeFile(path.join(absoluteOutput, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(path.join(absoluteOutput, "report.md"), renderMarkdown(report), "utf8");
  return report;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const report = await checkExternalLinks();
  console.log(`[external-links] OK ${report.summary.ok}; warnings ${report.summary.warnings}; broken ${report.summary.broken}`);
  if (report.summary.broken > 0) process.exitCode = 1;
}
