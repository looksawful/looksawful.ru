import { PRIVATE_MEDIA_UPSTREAMS } from "../_lib/private-media-map.js";
import { proxyPrivateMediaRequest } from "../_lib/media-proxy.js";

export async function onRequest(context) {
  const response = await proxyPrivateMediaRequest({
    request: context.request,
    upstreams: PRIVATE_MEDIA_UPSTREAMS,
  });
  return response ?? context.next();
}
