import {
  clearSessionCookie,
  requestHasSameOrigin,
  requireAuthConfig,
  secureResponse,
  unavailableResponse,
} from "../_lib/auth.js";

export async function onRequest({ request, env }) {
  try {
    requireAuthConfig(env);
  } catch {
    return unavailableResponse();
  }

  if (request.method !== "POST") {
    return secureResponse(new Response("Method Not Allowed\n", {
      status: 405,
      headers: { allow: "POST", "content-type": "text/plain; charset=utf-8" },
    }));
  }

  if (!requestHasSameOrigin(request)) {
    return secureResponse(new Response("Forbidden\n", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }));
  }

  return secureResponse(new Response(null, {
    status: 303,
    headers: {
      location: "/__preview/login",
      "set-cookie": clearSessionCookie(),
    },
  }));
}
