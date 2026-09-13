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
  return typeof origin === "string" && origin === requestUrl.origin;
}
