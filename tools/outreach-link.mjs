import { pathToFileURL } from "node:url";

const SITE_ORIGIN = "https://www.looksawful.ru";
const APPROVED_SOURCE_MEDIUM = new Map([
  ["hh", new Set(["message"])],
  ["telegram", new Set(["dm"])],
  ["instagram", new Set(["dm", "bio", "story"])],
  ["email", new Set(["outreach"])],
  ["linkedin", new Set(["dm"])],
]);
const APPROVED_CAMPAIGNS_BY_SOURCE_MEDIUM = new Map([
  ["hh:message", new Set(["job_search"])],
  ["telegram:dm", new Set(["job_search"])],
  ["instagram:dm", new Set(["job_search"])],
  ["instagram:bio", new Set(["portfolio"])],
  ["instagram:story", new Set(["portfolio"])],
  ["email:outreach", new Set(["job_search"])],
  ["linkedin:dm", new Set(["job_search"])],
]);
const SUPPORTED_FIELDS = new Set([
  "destination",
  "source",
  "medium",
  "campaign",
  "content",
  "batch",
]);
const SAFE_ATTRIBUTION_TOKEN = /^[a-z0-9](?:[a-z0-9_-]{0,63})$/;

function requireObject(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Outreach link input must be an object.");
  }

  for (const key of Object.keys(input)) {
    if (!SUPPORTED_FIELDS.has(key)) {
      throw new Error(`Unsupported outreach field: ${key}`);
    }
  }
}

function requireCanonicalSitePath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    throw new Error("Destination must be a canonical site path.");
  }
  if (value.includes("?") || value.includes("#") || value.includes("\\")) {
    throw new Error("Destination must be a canonical site path without query or fragment.");
  }

  const url = new URL(value, SITE_ORIGIN);
  if (url.origin !== SITE_ORIGIN || url.pathname !== value) {
    throw new Error("Destination must be a canonical site path.");
  }
  return url;
}

function requireApprovedAttribution(source, medium, campaign) {
  if (typeof source !== "string" || typeof medium !== "string") {
    throw new Error("Use an approved outreach source/medium pair.");
  }
  if (!APPROVED_SOURCE_MEDIUM.get(source)?.has(medium)) {
    throw new Error("Use an approved outreach source/medium pair.");
  }
  if (typeof campaign !== "string" || !APPROVED_CAMPAIGNS_BY_SOURCE_MEDIUM.get(`${source}:${medium}`)?.has(campaign)) {
    throw new Error("Use an approved outreach campaign for this source/medium pair.");
  }
  return campaign;
}

function optionalSafeAttributionToken(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !SAFE_ATTRIBUTION_TOKEN.test(value)) {
    throw new Error("Optional attribution values must be a safe attribution token.");
  }
  return value;
}

export function buildOutreachUrl(input) {
  requireObject(input);
  const url = requireCanonicalSitePath(input.destination);
  const campaign = requireApprovedAttribution(input.source, input.medium, input.campaign);
  const content = optionalSafeAttributionToken(input.content);
  const batch = optionalSafeAttributionToken(input.batch);

  url.searchParams.set("utm_source", input.source);
  url.searchParams.set("utm_medium", input.medium);
  url.searchParams.set("utm_campaign", campaign);
  if (content) url.searchParams.set("utm_content", content);
  if (batch) url.searchParams.set("utm_id", batch);

  return url.href;
}

function parseCliArgs(args) {
  const input = {};
  const fieldByFlag = new Map([
    ["--destination", "destination"],
    ["--source", "source"],
    ["--medium", "medium"],
    ["--campaign", "campaign"],
    ["--content", "content"],
    ["--batch", "batch"],
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const field = fieldByFlag.get(flag);
    if (!field) throw new Error(`Unsupported outreach flag: ${flag}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
    input[field] = value;
    index += 1;
  }

  return input;
}

const executedDirectly = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (executedDirectly) {
  try {
    console.log(buildOutreachUrl(parseCliArgs(process.argv.slice(2))));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}