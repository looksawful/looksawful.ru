import { handleGitHubOAuth, verifyAdminSession } from "./github-oauth.js";

function securityHeaders() {
  return {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  };
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders())) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function protectedResponse(message, status) {
  return withSecurityHeaders(
    new Response(message, {
      status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    }),
  );
}

export async function onRequest(context) {
  let authResponse;
  try {
    authResponse = await handleGitHubOAuth({
      request: context.request,
      env: context.env,
    });
  } catch {
    return protectedResponse("Admin authentication failed.", 503);
  }
  if (authResponse) return withSecurityHeaders(authResponse);

  const session = await verifyAdminSession(context.request, context.env);
  if (!session) {
    if (context.request.method === "GET" || context.request.method === "HEAD") {
      return withSecurityHeaders(
        Response.redirect(new URL("/auth/github", context.request.url).toString(), 302),
      );
    }
    return protectedResponse("Authentication required.", 401);
  }

  return withSecurityHeaders(await context.next());
}
