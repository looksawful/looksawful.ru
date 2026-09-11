export const CONTENT_DESK_AUTHORING_BRANCH = "content/text-cms";
export const CONTENT_DESK_LOOPBACK_HOST = "127.0.0.1";

export function assertContentDeskWriteAllowed({ branch, ci, githubActions, args }) {
  if (ci || githubActions) {
    throw new Error("Content Desk write mode is disabled in CI/GitHub Actions");
  }

  if (branch !== CONTENT_DESK_AUTHORING_BRANCH) {
    throw new Error(
      `Content Desk write mode requires ${CONTENT_DESK_AUTHORING_BRANCH}; current branch is ${branch}`,
    );
  }

  if (args.some((arg) => arg === "--host" || arg.startsWith("--host="))) {
    throw new Error(`Content Desk write mode host is fixed to ${CONTENT_DESK_LOOPBACK_HOST}`);
  }
}
