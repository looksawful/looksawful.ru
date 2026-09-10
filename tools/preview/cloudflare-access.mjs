import path from "node:path";
import { pathToFileURL } from "node:url";

const ACCESS_LOGIN_PATH = "/cdn-cgi/access/login";

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

export function isAccessChallenge(response) {
  if ([401, 403].includes(response.status)) return true;
  if (![301, 302, 303, 307, 308].includes(response.status)) return false;
  const location = response.headers.get("location") ?? "";
  return location.includes(ACCESS_LOGIN_PATH) || location.includes(".cloudflareaccess.com/");
}

export async function verifyPreviewPrivacy({
  url,
  marker = "",
  env = process.env,
  fetchImpl = fetch,
}) {
  const serviceHeaders = getAccessServiceHeaders(env);
  const serviceConfigured = Object.keys(serviceHeaders).length > 0;
  const anonymous = await fetchImpl(url, {
    method: "GET",
    redirect: "manual",
    headers: { "Cache-Control": "no-cache" },
  });
  const anonymousBlocked = isAccessChallenge(anonymous);

  if (!serviceConfigured) {
    return {
      serviceConfigured: false,
      anonymousBlocked,
      authenticated: false,
      anonymousStatus: anonymous.status,
    };
  }

  if (!anonymousBlocked) {
    throw new Error(`Anonymous request still reaches preview content (HTTP ${anonymous.status}).`);
  }

  const authenticatedResponse = await fetchImpl(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      ...serviceHeaders,
      "Cache-Control": "no-cache",
    },
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
    await route.continue({
      headers: {
        ...request.headers(),
        ...headers,
      },
    });
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

export async function probeAccessApi({
  accountId = envValue(process.env, "CLOUDFLARE_ACCOUNT_ID"),
  apiToken = envValue(process.env, "CLOUDFLARE_API_TOKEN"),
  project = envValue(process.env, "CLOUDFLARE_PAGES_PROJECT"),
  fetchImpl = fetch,
} = {}) {
  if (!accountId || !apiToken) {
    return { accessible: false, reason: "missing-cloudflare-api-credentials", applications: [] };
  }

  const response = await fetchImpl(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/access/apps?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    return { accessible: false, reason: `http-${response.status}`, applications: [] };
  }

  const payload = await response.json();
  if (!payload?.success || !Array.isArray(payload.result)) {
    return { accessible: false, reason: "cloudflare-api-error", applications: [] };
  }

  const applications = payload.result.map((app) => ({
    id: typeof app.id === "string" ? app.id : "",
    name: typeof app.name === "string" ? app.name : "",
    domain: typeof app.domain === "string" ? app.domain : "",
    type: typeof app.type === "string" ? app.type : "",
    matchesPreviewProject: Boolean(
      project && typeof app.domain === "string" && app.domain.includes(`${project}.pages.dev`),
    ),
  }));

  return { accessible: true, reason: "ok", applications };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? "" : "";
}

async function runCli() {
  const command = process.argv[2] ?? "status";
  if (command === "status") {
    const status = await probeAccessApi();
    if (!status.accessible) {
      console.log(`[preview-access] API probe unavailable: ${status.reason}`);
      return;
    }
    const matches = status.applications.filter((app) => app.matchesPreviewProject);
    console.log(`[preview-access] API readable; matching preview applications: ${matches.length}`);
    for (const app of matches) {
      console.log(`[preview-access] ${app.name || "unnamed"} | ${app.domain || "no-domain"} | ${app.type || "unknown"}`);
    }
    return;
  }

  if (command === "verify") {
    const url = argument("--url");
    const marker = argument("--marker");
    if (!url) throw new Error("cloudflare-access verify requires --url.");
    const result = await verifyPreviewPrivacy({ url, marker });
    if (!result.serviceConfigured) {
      const state = result.anonymousBlocked ? "anonymous-blocked" : "PUBLIC";
      console.log(`[preview-access] service credentials not configured; observed state: ${state} (HTTP ${result.anonymousStatus}).`);
      if (!result.anonymousBlocked) {
        console.log("::warning::Preview privacy is incomplete. Enable Cloudflare Access and configure CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET.");
      }
      return;
    }
    console.log(`[preview-access] anonymous denied; CI service authentication succeeded (HTTP ${result.authenticatedStatus}).`);
    return;
  }

  throw new Error(`Unknown cloudflare-access command: ${command}`);
}

const directPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (import.meta.url === directPath) {
  await runCli();
}
