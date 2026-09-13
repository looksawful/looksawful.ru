import {
  readSessionCookie,
  requireAuthConfig,
  secureResponse,
  unavailableResponse,
  verifySessionToken,
} from "./_lib/auth.js";

const TRUSTED_ENDPOINTS = new Set([
  "/__preview/login",
  "/__preview/logout",
  "/__preview/ci-session",
]);

function loginRedirect(url) {
  const next = `${url.pathname}${url.search}`;
  return secureResponse(new Response(null, {
    status: 303,
    headers: { location: `/__preview/login?next=${encodeURIComponent(next)}` },
  }));
}

function unauthorizedResponse() {
  return secureResponse(new Response("Unauthorized\n", {
    status: 401,
    headers: { "content-type": "text/plain; charset=utf-8" },
  }));
}

export async function onRequest(context) {
  let config;
  try {
    config = requireAuthConfig(context.env);
  } catch {
    return unavailableResponse();
  }

  const url = new URL(context.request.url);

  if (url.pathname.startsWith("/__preview/")) {
    if (!TRUSTED_ENDPOINTS.has(url.pathname)) {
      return secureResponse(new Response("Not Found\n", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }));
    }
    return secureResponse(await context.next());
  }

  const session = readSessionCookie(context.request);
  const authenticated = session
    ? await verifySessionToken(session, {
        host: url.host,
        secret: config.sessionSecret,
      })
    : null;

  if (!authenticated) {
    if (context.request.method === "GET" || context.request.method === "HEAD") {
      return loginRedirect(url);
    }
    return unauthorizedResponse();
  }

  return secureResponse(await context.next());
}
