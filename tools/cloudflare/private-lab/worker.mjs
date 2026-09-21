import { onRequest } from "../../../lab/functions/_middleware.js";

export default {
  async fetch(request, env) {
    return onRequest({
      request,
      env,
      next: () => env.ASSETS.fetch(request),
    });
  },
};
