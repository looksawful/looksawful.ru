const USERNAME = "lab";
const REALM = "looksawful lab";

function securityHeaders() {
  return {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  };
}

function protectedResponse(message, status) {
  const headers = {
    ...securityHeaders(),
    "Content-Type": "text/plain; charset=utf-8",
  };
  if (status === 401) {
    headers["WWW-Authenticate"] = `Basic realm="${REALM}", charset="UTF-8"`;
  }
  return new Response(message, { status, headers });
}

function readCredentials(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6).trim());
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const expectedPassword = context.env.LAB_PASSWORD;
  if (typeof expectedPassword !== "string" || expectedPassword.length === 0) {
    return protectedResponse("Lab authentication is not configured.", 503);
  }

  const credentials = readCredentials(context.request.headers.get("Authorization"));
  if (!credentials || credentials.username !== USERNAME || credentials.password !== expectedPassword) {
    return protectedResponse("Authentication required", 401);
  }

  const response = await context.next();
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders())) headers.set(name, value);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
