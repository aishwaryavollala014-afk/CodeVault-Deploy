import { githubApi } from '../../lib/github';
import logger from '../../lib/logger';
import { ForbiddenError, NotFoundError, UpstreamError } from '../../utils/errors';
import type { CommitInfo, GithubFile } from '../../types/github.types';

function splitRepo(repoFullName: string): { owner: string; repo: string } {
  const [owner, repo] = repoFullName.split('/');
  if (!owner || !repo) throw new UpstreamError(`Invalid repo name: ${repoFullName}`);
  return { owner, repo };
}

function wrap(err: any, ctx: string): never {
  const status = err?.response?.status;
  if (status === 404) throw new NotFoundError(`${ctx}: not found`);
  if (status === 403 || status === 401) throw new ForbiddenError(`${ctx}: access denied`);
  if (err instanceof UpstreamError || err instanceof ForbiddenError || err instanceof NotFoundError) {
    throw err;
  }
  logger.error(err, `GitHub call failed: ${ctx}`);
  throw new UpstreamError(`${ctx}: GitHub request failed`);
}

// Confirm the token owner can PUSH to the repo (ownership/write check before any commit).
export async function verifyRepoAccess(token: string, repoFullName: string): Promise<void> {
  const { owner, repo } = splitRepo(repoFullName);
  try {
    const { data } = await githubApi(token).get(`/repos/${owner}/${repo}`);
    if (!data?.permissions?.push) {
      throw new ForbiddenError(`No push access to ${repoFullName}`);
    }
  } catch (err) {
    wrap(err, `verifyRepoAccess(${repoFullName})`);
  }
}

// Commit multiple files in a single commit via the Git Data API.
export async function pushFiles(
  token: string,
  repoFullName: string,
  branch: string,
  files: GithubFile[],
  message: string,
): Promise<{ commitSha: string }> {
  if (files.length === 0) return { commitSha: '' };
  const { owner, repo } = splitRepo(repoFullName);
  const api = githubApi(token);
  const base = `/repos/${owner}/${repo}`;

  try {
    // 1. current branch tip — may not exist if the repo is brand new / empty.
    // GitHub returns 409 "Git Repository is empty" or 404 for a missing branch; in that
    // case we bootstrap the very first commit (no base tree, no parent, create the ref).
    let baseSha: string | null = null;
    let baseTreeSha: string | null = null;
    try {
      const ref = await api.get(`${base}/git/ref/heads/${branch}`);
      baseSha = ref.data.object.sha;
      const baseCommit = await api.get(`${base}/git/commits/${baseSha}`);
      baseTreeSha = baseCommit.data.tree.sha;
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status !== 409 && status !== 404) throw e;
    }

    // 2. blobs
    const tree = [];
    for (const f of files) {
      const blob = await api.post(`${base}/git/blobs`, {
        content: Buffer.from(f.content, 'utf8').toString('base64'),
        encoding: 'base64',
      });
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.data.sha });
    }

    // 3. new tree (only chain onto a base tree when the branch already has one)
    const newTree = await api.post(`${base}/git/trees`, {
      ...(baseTreeSha ? { base_tree: baseTreeSha } : {}),
      tree,
    });

    // 4. new commit (first commit on an empty repo has no parents)
    const commit = await api.post(`${base}/git/commits`, {
      message,
      tree: newTree.data.sha,
      parents: baseSha ? [baseSha] : [],
    });

    // 5. create the branch (empty repo) or move it (existing branch)
    if (baseSha) {
      await api.patch(`${base}/git/refs/heads/${branch}`, { sha: commit.data.sha });
    } else {
      await api.post(`${base}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.data.sha });
    }

    return { commitSha: commit.data.sha };
  } catch (err) {
    return wrap(err, `pushFiles(${repoFullName})`);
  }
}

// Read a single file's text content (used for diffing / problem detail).
export async function readFile(
  token: string,
  repoFullName: string,
  path: string,
): Promise<string> {
  const { owner, repo } = splitRepo(repoFullName);
  try {
    const { data } = await githubApi(token).get(`/repos/${owner}/${repo}/contents/${path}`);
    return Buffer.from(data.content, 'base64').toString('utf8');
  } catch (err) {
    return wrap(err, `readFile(${path})`);
  }
}

export async function listCommits(
  token: string,
  repoFullName: string,
  opts?: { perPage?: number },
): Promise<CommitInfo[]> {
  const { owner, repo } = splitRepo(repoFullName);
  try {
    const { data } = await githubApi(token).get(`/repos/${owner}/${repo}/commits`, {
      params: { per_page: opts?.perPage ?? 30 },
    });
    return (data as any[]).map((c) => ({
      sha: c.sha,
      message: c.commit?.message ?? '',
      committedAt: c.commit?.committer?.date ?? '',
    }));
  } catch (err) {
    return wrap(err, `listCommits(${repoFullName})`);
  }
}
