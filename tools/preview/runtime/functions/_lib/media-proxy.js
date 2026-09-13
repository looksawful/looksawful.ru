const REQUEST_HEADER_ALLOWLIST = [
  "accept",
  "range",
  "if-none-match",
  "if-modified-since",
  "if-range",
];

const RESPONSE_HEADER_ALLOWLIST = [
  "accept-ranges",
  "content-disposition",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
];

function canonicalRequestPath(request) {
  const pathname = new URL(request.url).pathname;
  try {
    return pathname
      .split("/")
      .map((segment, index) => (index === 0 ? "" : encodeURIComponent(decodeURIComponent(segment))))
      .join("/");
  } catch {
    return null;
  }
}

function forwardedRequestHeaders(request) {
  const headers = new Headers();
  for (const name of REQUEST_HEADER_ALLOWLIST) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return headers;
}

function safeResponseHeaders(upstreamResponse) {
  const headers = new Headers();
  for (const name of RESPONSE_HEADER_ALLOWLIST) {
    const value = upstreamResponse.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  return headers;
}

function bodyAllowed(status, method) {
  return method !== "HEAD" && status !== 204 && status !== 205 && status !== 304;
}

export async function proxyPrivateMediaRequest({
  request,
  upstreams,
  fetchImpl = fetch,
} = {}) {
  if (!(request instanceof Request)) throw new Error("private media proxy request is required");
  if (upstreams === null || typeof upstreams !== "object" || Array.isArray(upstreams)) {
    throw new Error("private media upstream allowlist is required");
  }
  if (typeof fetchImpl !== "function") throw new Error("private media fetch implementation is required");

  const pathname = canonicalRequestPath(request);
  if (!pathname) return null;
  const upstream = upstreams[pathname];
  if (typeof upstream !== "string" || upstream.length === 0) return null;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed\n", {
      status: 405,
      headers: {
        allow: "GET, HEAD",
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  const upstreamResponse = await fetchImpl(upstream, {
    method: request.method,
    headers: forwardedRequestHeaders(request),
    redirect: "manual",
  });

  if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
    return new Response("Private media upstream refused a redirect.\n", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(
    bodyAllowed(upstreamResponse.status, request.method) ? upstreamResponse.body : null,
    {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: safeResponseHeaders(upstreamResponse),
    },
  );
}
