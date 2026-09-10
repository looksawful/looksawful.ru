const SAFE_ASSET_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const encoder = new TextEncoder();

export function parseRepositoryName(value) {
  const match = /^([^/]+)\/([^/]+)$/u.exec(value);
  if (!match) throw new Error("GitHub repository must use owner/name format");
  return { owner: match[1], name: match[2] };
}

export function mediaCandidatePaths(id) {
  if (typeof id !== "string" || !SAFE_ASSET_ID.test(id)) {
    throw new TypeError("Media Desk asset id is invalid");
  }
  const uploadId = id.startsWith("cms-") ? id.slice(4) : id;
  return [
    `src/content/media-catalog/registered/${id}.json`,
    `src/content/media-catalog/uploads/${uploadId}.json`,
  ];
}

export function utf8ToBase64(value) {
  const bytes = encoder.encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function githubHeaders(token) {
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "user-agent": "looksawful-media-desk-cloudflare",
    "x-github-api-version": "2022-11-28",
  };
}

async function githubGraphql({ token, query, variables, fetchImpl = fetch }) {
  const response = await fetchImpl("https://api.github.com/graphql", {
    method: "POST",
    headers: githubHeaders(token),
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    const message = payload.errors?.map((item) => item.message).join("; ")
      || `GitHub GraphQL HTTP ${response.status}`;
    throw new Error(message);
  }
  return payload.data;
}

export async function readRepositoryFiles({
  repository,
  branch,
  token,
  paths,
  fetchImpl = fetch,
}) {
  const uniquePaths = [...new Set(paths)];
  const { owner, name } = parseRepositoryName(repository);
  const definitions = ["$owner:String!", "$name:String!", "$ref:String!"];
  const variables = {
    owner,
    name,
    ref: `refs/heads/${branch}`,
  };
  const fields = uniquePaths.map((path, index) => {
    const variable = `expr${index}`;
    definitions.push(`$${variable}:String!`);
    variables[variable] = `${branch}:${path}`;
    return `f${index}:object(expression:$${variable}){... on Blob{oid text}}`;
  });

  const query = `query ReadFiles(${definitions.join(",")}){repository(owner:$owner,name:$name){ref(qualifiedName:$ref){target{oid}} ${fields.join(" ")}}}`;
  const data = await githubGraphql({ token, query, variables, fetchImpl });
  const repo = data?.repository;
  const headOid = repo?.ref?.target?.oid;
  if (!headOid) throw new Error(`GitHub branch "${branch}" was not found`);

  const files = new Map();
  uniquePaths.forEach((path, index) => {
    const node = repo[`f${index}`];
    files.set(path, node?.text === undefined || node?.text === null
      ? null
      : { oid: node.oid, text: node.text });
  });

  return { headOid, files };
}

export async function listRepositoryFiles({
  repository,
  branch,
  token,
  fetchImpl = fetch,
}) {
  const { owner, name } = parseRepositoryName(repository);
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const response = await fetchImpl(url, { headers: githubHeaders(token) });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || `GitHub tree HTTP ${response.status}`);
  }
  if (payload.truncated) {
    throw new Error("GitHub repository tree response was truncated");
  }
  return Array.isArray(payload.tree)
    ? payload.tree.filter((entry) => entry?.type === "blob" && typeof entry.path === "string")
        .map((entry) => entry.path)
    : [];
}

export async function commitRepositoryFiles({
  repository,
  branch,
  token,
  expectedHeadOid,
  additions,
  message,
  fetchImpl = fetch,
}) {
  if (!Array.isArray(additions) || additions.length === 0) {
    throw new Error("GitHub commit requires at least one file addition");
  }

  const query = `mutation Commit($input:CreateCommitOnBranchInput!){createCommitOnBranch(input:$input){commit{oid url} ref{name}}}`;
  const variables = {
    input: {
      branch: {
        repositoryNameWithOwner: repository,
        branchName: branch,
      },
      expectedHeadOid,
      message: { headline: message },
      fileChanges: {
        additions: additions.map(({ path, content }) => ({
          path,
          contents: utf8ToBase64(content),
        })),
      },
    },
  };

  const data = await githubGraphql({ token, query, variables, fetchImpl });
  const commit = data?.createCommitOnBranch?.commit;
  if (!commit?.oid) throw new Error("GitHub did not return the created commit");
  return commit;
}
