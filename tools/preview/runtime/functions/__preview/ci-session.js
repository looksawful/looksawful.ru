import {
  CI_SESSION_SECONDS,
  createSessionToken,
  requireAuthConfig,
  secureResponse,
  sessionSetCookie,
  unavailableResponse,
  verifyHashedSecret,
} from "../_lib/auth.js";

export async function onRequest({ request, env }) {
  let config;
  try {
    config = requireAuthConfig(env);
  } catch {
    return unavailableResponse();
  }

  if (request.method !== "POST") {
    return secureResponse(new Response("Method Not Allowed\n", {
      status: 405,
      headers: { allow: "POST", "content-type": "text/plain; charset=utf-8" },
    }));
  }

  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!(await verifyHashedSecret(token, config.ciTokenHash))) {
    return secureResponse(new Response("Unauthorized\n", {
      status: 401,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }));
  }

  const url = new URL(request.url);
  const session = await createSessionToken({
    host: url.host,
    secret: config.sessionSecret,
    ttlSeconds: CI_SESSION_SECONDS,
  });
  return secureResponse(new Response(null, {
    status: 204,
    headers: { "set-cookie": sessionSetCookie(session, CI_SESSION_SECONDS) },
  }));
}
