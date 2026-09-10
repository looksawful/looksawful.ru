import path from "node:path";
import { pathToFileURL } from "node:url";

const ACCESS_LOGIN_PATH = "/cdn-cgi/access/";

function envValue(env, key) {
  const value = env?.[key];
  return typeof value === "string" ? value.trim() : "";
}

export function getAccessServiceHeaders(env = process.env) {
  const clientId = envValue(env, "CF_ACCESS_CLIENT_ID");
  const clientSecret = envValue(env, "CF_ACCESS_CLIENT_SECRET");
  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new Error("Both CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET are required together.");
  }
  if (!clientId) return {};
  return {
    "CF-Access-Client-Id": clientId,
    "CF-Access-Client-Secret": clientSecret,
  };
}

function isCloudflareAccessRedirect(location, responseUrl = "") {
  if (!location) return false;
  try {
    const base = responseUrl || "https://preview.invalid/";
    const target = new URL(location, base);
    const host = target.hostname.toLowerCase();
    return host.endsWith(".cloudflareaccess.com") && target.pathname.startsWith(ACCESS_LOGIN_PATH);
  } catch {
    return false;
  }
}

export function isAccessChallenge(response) {
  if ([401, 403].includes(response.status)) return true;
  if (![301, 302, 303, 307, 308].includes(response.status)) return false;
  return isCloudflareAccessRedirect(response.headers.get("location") ?? "", response.url);
}

export async function verifyPreviewPrivacy({ url, marker = "", env = process.env, fetchImpl = fetch }) {
  const serviceHeaders = getAccessServiceHeaders(env);
  const serviceConfigured = Object.keys(serviceHeaders).length > 0;
  const anonymous = await fetchImpl(url, {
    method: "GET",
    redirect: "manual",
    headers: { "Cache-Control": "no-cache" },
  });
  const anonymousBlocked = isAccessChallenge(anonymous);
  if (!anonymousBlocked) {
    throw new Error(`Anonymous request still reaches preview content (HTTP ${anonymous.status}).`);
  }
  if (!serviceConfigured) {
    return { serviceConfigured: false, anonymousBlocked: true, authenticated: false, anonymousStatus: anonymous.status };
  }

  const authenticatedResponse = await fetchImpl(url, {
    method: "GET",
    redirect: "follow",
    headers: { ...serviceHeaders, "Cache-Control": "no-cache" },
  });
  if (!authenticatedResponse.ok) {
    throw new Error(`Cloudflare Access service authentication failed with HTTP ${authenticatedResponse.status}.`);
  }
  const body = await authenticatedResponse.text();
  if (marker && !body.includes(marker)) {
    throw new Error("Authenticated preview response did not contain the expected exact-content marker.");
  }
  return {
    serviceConfigured: true,
    anonymousBlocked: true,
    authenticated: true,
    anonymousStatus: anonymous.status,
    authenticatedStatus: authenticatedResponse.status,
  };
}

async function addScopedAccessRoute(target, previewOrigin, headers) {
  if (Object.keys(headers).length === 0) return target;
  await target.route("**/*", async (route) => {
    const request = route.request();
    let origin = "";
    try {
      origin = new URL(request.url()).origin;
    } catch {
      await route.continue();
      return;
    }
    if (origin !== previewOrigin) {
      await route.continue();
      return;
    }
    await route.continue({ headers: { ...request.headers(), ...headers } });
  });
  return target;
}

export function wrapBrowserWithAccess(browser, previewOrigin, env = process.env) {
  const headers = getAccessServiceHeaders(env);
  if (Object.keys(headers).length === 0) return browser;
  return new Proxy(browser, {
    get(target, property) {
      if (property === "newPage") {
        return async (options) => addScopedAccessRoute(await target.newPage(options), previewOrigin, headers);
      }
      if (property === "newContext") {
        return async (options) => addScopedAccessRoute(await target.newContext(options), previewOrigin, headers);
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? "" : "";
}

async function runCli() {
  const command = process.argv[2] ?? "verify";
  if (command !== "verify") throw new Error(`Unknown cloudflare-access command: ${command}`);
  const url = argument("--url");
  const marker = argument("--marker");
  if (!url) throw new Error("cloudflare-access verify requires --url.");
  const result = await verifyPreviewPrivacy({ url, marker });
  if (!result.serviceConfigured) {
    console.log(`[preview-access] anonymous access is denied (HTTP ${result.anonymousStatus}); CI service credentials are not configured.`);
    return;
  }
  console.log(`[preview-access] anonymous denied; CI service authentication succeeded (HTTP ${result.authenticatedStatus}).`);
}

const directPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === directPath) await runCli();
