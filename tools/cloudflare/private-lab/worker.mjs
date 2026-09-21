import { onRequest } from "../../../lab/functions/_middleware.js";

const PUBLIC_MEDIA_ORIGIN = "https://www.looksawful.ru";
const FORWARDED_MEDIA_HEADERS = [
  "accept",
  "accept-encoding",
  "if-modified-since",
  "if-none-match",
  "range",
];

async function proxyPublicMedia(request) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const sourceUrl = new URL(request.url);
  const upstreamUrl = new URL(
    sourceUrl.pathname + sourceUrl.search,
    PUBLIC_MEDIA_ORIGIN,
  );
  const headers = new Headers();

  for (const name of FORWARDED_MEDIA_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  return fetch(upstreamUrl, {
    method: request.method,
    headers,
    redirect: "follow",
  });
}

export default {
  async fetch(request, env) {
    return onRequest({
      request,
      env,
      next: () => {
        const { pathname } = new URL(request.url);
        if (pathname.startsWith("/media/")) {
          return proxyPublicMedia(request);
        }
        return env.ASSETS.fetch(request);
      },
    });
  },
};
