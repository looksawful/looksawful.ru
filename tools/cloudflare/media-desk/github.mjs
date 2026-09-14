export const MEDIA_DESK_AUTHORING_BRANCH = "content/text-cms";

const REPOSITORY = "looksawful/looksawful.ru";
const API_ROOT = `https://api.github.com/repos/${REPOSITORY}`;
const ALLOWED_WRITE_ROOTS = [
  "src/content/",
  "src/data/media/",
  "public/media/",
  "public/pets/",
];
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function githubHeaders(token) {
  if (typeof token !== "string" || token.length === 0) {
    throw new TypeError("Media Desk GitHub token is required");
  }
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "user-agent": "looksawful-media-desk-cloudflare",
    "x-github-api-version": "2022-11-28",
  };
}

function assertAllowedPath(path) {
  if (
    typeof path !== "string"
    || path.length === 0
    || path.startsWith("/")
    || path.includes("\\")
    || path.split("/").some((segment) => segment === "" || segment === "." || segment === "..")
    || !ALLOWED_WRITE_ROOTS.some((root) => path.startsWith(root))
  ) {
    throw new Error(`Media Desk repository path is not allowed: ${String(path)}`);
  }
  return path;
}

function encodeRepositoryPath(path) {
  return assertAllowedPath(path)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function asBytes(content) {
  if (typeof content === "string") return encoder.encode(content);
  if (content instanceof Uint8Array) return content;
  if (content instanceof ArrayBuffer) return new Uint8Array(content);
  throw new TypeError("Media Desk repository file content must be a string or byte buffer");
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  if (typeof value !== "string") throw new Error("GitHub file payload is missing base64 content");
  const binary = atob(value.replace(/\s+/gu, ""));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function sha256(bytes) {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is required for Media Desk revisions");
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", bytes));
  return [...digest].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function githubJson(url, { token, method = "GET", body, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    method,
    headers: githubHeaders(token),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Preserve the HTTP failure below even when GitHub returned no JSON body.
  }

  if (!response.ok) {
    const detail = payload?.message ? `: ${payload.message}` : "";
    throw new Error(`GitHub ${method} failed with HTTP ${response.status}${detail}`);
  }
  return payload;
}

async function readAuthoringHead({ token, fetchImpl = fetch }) {
  const payload = await githubJson(
    `${API_ROOT}/git/ref/heads/${MEDIA_DESK_AUTHORING_BRANCH}`,
    { token, fetchImpl },
  );
  const sha = payload?.object?.sha;
  if (typeof sha !== "string" || sha.length === 0) {
    throw new Error(`GitHub branch ${MEDIA_DESK_AUTHORING_BRANCH} has no commit SHA`);
  }
  return sha;
}

function staleHead(expected, actual) {
  return new Error(`Stale branch head: expected ${expected}, current ${actual}`);
}

export async function readRepositoryFile({ token, path, fetchImpl = fetch }) {
  const encodedPath = encodeRepositoryPath(path);
  const branchHead = await readAuthoringHead({ token, fetchImpl });
  const payload = await githubJson(
    `${API_ROOT}/contents/${encodedPath}?ref=${encodeURIComponent(MEDIA_DESK_AUTHORING_BRANCH)}`,
    { token, fetchImpl },
  );

  if (payload?.encoding !== "base64" || typeof payload?.sha !== "string") {
    throw new Error(`GitHub file payload is invalid for ${path}`);
  }

  const bytes = base64ToBytes(payload.content);
  return {
    text: decoder.decode(bytes),
    blobSha: payload.sha,
    revision: await sha256(bytes),
    branchHead,
  };
}

export async function commitRepositoryFiles({
  token,
  expectedHead,
  files,
  message,
  fetchImpl = fetch,
}) {
  if (typeof expectedHead !== "string" || expectedHead.length === 0) {
    throw new TypeError("Media Desk expected branch head is required");
  }
  if (typeof message !== "string" || message.trim().length === 0) {
    throw new TypeError("Media Desk commit message is required");
  }
  if (!Array.isArray(files) || files.length === 0) {
    throw new TypeError("Media Desk commit requires at least one file");
  }

  const prepared = files.map((file) => {
    const path = assertAllowedPath(file?.path);
    if (file?.delete === true) return { path, delete: true, bytes: null };
    return { path, delete: false, bytes: asBytes(file?.content) };
  });
  const uniquePaths = new Set(prepared.map(({ path }) => path));
  if (uniquePaths.size !== prepared.length) {
    throw new Error("Media Desk commit contains duplicate repository paths");
  }

  const currentHead = await readAuthoringHead({ token, fetchImpl });
  if (currentHead !== expectedHead) throw staleHead(expectedHead, currentHead);

  const baseCommit = await githubJson(`${API_ROOT}/git/commits/${encodeURIComponent(expectedHead)}`, {
    token,
    fetchImpl,
  });
  const baseTree = baseCommit?.tree?.sha;
  if (typeof baseTree !== "string" || baseTree.length === 0) {
    throw new Error("GitHub base commit is missing its tree SHA");
  }

  const treeEntries = [];
  for (const file of prepared) {
    if (file.delete) {
      treeEntries.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: null,
      });
      continue;
    }

    const blob = await githubJson(`${API_ROOT}/git/blobs`, {
      token,
      method: "POST",
      body: {
        content: bytesToBase64(file.bytes),
        encoding: "base64",
      },
      fetchImpl,
    });
    if (typeof blob?.sha !== "string" || blob.sha.length === 0) {
      throw new Error(`GitHub did not return a blob SHA for ${file.path}`);
    }
    treeEntries.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  const tree = await githubJson(`${API_ROOT}/git/trees`, {
    token,
    method: "POST",
    body: {
      base_tree: baseTree,
      tree: treeEntries,
    },
    fetchImpl,
  });
  if (typeof tree?.sha !== "string" || tree.sha.length === 0) {
    throw new Error("GitHub did not return the candidate tree SHA");
  }

  const commit = await githubJson(`${API_ROOT}/git/commits`, {
    token,
    method: "POST",
    body: {
      message: message.trim(),
      tree: tree.sha,
      parents: [expectedHead],
    },
    fetchImpl,
  });
  if (typeof commit?.sha !== "string" || commit.sha.length === 0) {
    throw new Error("GitHub did not return the candidate commit SHA");
  }

  const finalHead = await readAuthoringHead({ token, fetchImpl });
  if (finalHead !== expectedHead) throw staleHead(expectedHead, finalHead);

  const updatedRef = await githubJson(
    `${API_ROOT}/git/refs/heads/${MEDIA_DESK_AUTHORING_BRANCH}`,
    {
      token,
      method: "PATCH",
      body: { sha: commit.sha, force: false },
      fetchImpl,
    },
  );
  const branchHead = updatedRef?.object?.sha;
  if (branchHead !== commit.sha) {
    throw new Error("GitHub did not advance content/text-cms to the created commit");
  }

  return { commitSha: commit.sha, branchHead };
}
