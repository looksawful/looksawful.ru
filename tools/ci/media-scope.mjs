import { appendFileSync } from "node:fs";
import { writeMediaDevState } from "../media-dev-state.mjs";

// Cache is an optimization only. Validate binaries against tracked metadata even
// on an exact key hit. Missing/corrupt outputs take the genuine correctness path.
let needsSync = process.env.MEDIA_INPUTS_CHANGED !== "false" || process.env.MEDIA_CACHE_HIT !== "true";
if (!needsSync) {
  try { await writeMediaDevState(); }
  catch (error) {
    console.log(`[media-scope] cache cannot satisfy tracked metadata: ${error.message}`);
    needsSync = true;
  }
}
console.log(`[media-scope] deterministic sync required: ${needsSync}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `needs_sync=${needsSync}\n`);
