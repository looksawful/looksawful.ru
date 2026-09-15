const PROD_ORIGIN = "https://media.looksawful.ru";
const LOCAL_ORIGIN = /^http:\/\/127\.0\.0\.1(?::\d{2,5})?$/u;

export function isAllowedMediaDeskOrigin(value) {
  try {
    const origin = value instanceof URL ? value.origin : new URL(String(value)).origin;
    return origin === PROD_ORIGIN || LOCAL_ORIGIN.test(origin);
  } catch {
    return false;
  }
}

export function sameOriginMutation(request) {
  if (!(request instanceof Request)) return false;
  const requestUrl = new URL(request.url);
  if (!isAllowedMediaDeskOrigin(requestUrl)) return false;

  const origin = request.headers.get("origin");
  if (typeof origin === "string" && origin !== "null") {
    return origin === requestUrl.origin;
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (typeof fetchSite === "string" && fetchSite !== "same-origin") return false;

  const referer = request.headers.get("referer");
  if (typeof referer !== "string" || referer.length === 0) return false;

  try {
    return new URL(referer).origin === requestUrl.origin;
  } catch {
    return false;
  }
}
