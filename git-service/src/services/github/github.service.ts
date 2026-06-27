import { githubApi } from '../../lib/github';
import { UpstreamError, ForbiddenError, NotFoundError } from '../../utils/errors';
import type { CommitInfo, GithubFile } from '../../types/github.types';

function splitRepo(repoFullName: string): { owner: string; repo: string } {
  const [owner, repo] = repoFullName.split('/');
  return { owner, repo };
}

/**
 * Verify the authenticated GitHub token actually has PUSH access to the target
 * repo BEFORE writing anything — prevents pushing to a repo the user doesn't own
 * (mis-config or tampered repo mapping). See GITHUB_SECURITY.
 */
export async function verifyRepoAccess(token: string, repoFullName: string): Promise<void> {
  const api = githubApi(token);
  const { owner, repo } = splitRepo(repoFullName);
  let data: { permissions?: { push?: boolean } };
  try {
    data = (await api.get(`/repos/${owner}/${repo}`)).data;
  } catch {
    throw new NotFoundError(`Repo "${repoFullName}" not found or not accessible`);
  }
  if (!data.permissions?.push) {
    throw new ForbiddenError(`No push access to "${repoFullName}"`);
  }
}

/**
 * Push many files in ONE commit via the Git Data API (batch — keeps history
 * clean, fewer API calls). Steps: read branch tip -> create blobs -> build a
 * tree on top of the base tree -> create a commit -> move the branch ref.
 * Returns the new commit SHA. (PLATFORM_INTEGRATION §5.)
 */
export async function pushFiles(
  token: string,
  repoFullName: string,
  branch: string,
  files: GithubFile[],
  message: string,
): Promise<string> {
  if (files.length === 0) return '';
  const api = githubApi(token);
  const { owner, repo } = splitRepo(repoFullName);

  try {
    const ref = await api.get(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    const baseCommitSha: string = ref.data.object.sha;
    const baseCommit = await api.get(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
    const baseTreeSha: string = baseCommit.data.tree.sha;

    const tree = await Promise.all(
      files.map(async (f) => {
        const blob = await api.post(`/repos/${owner}/${repo}/git/blobs`, {
          content: f.content,
          encoding: 'utf-8',
        });
        return { path: f.path, mode: '100644', type: 'blob', sha: blob.data.sha as string };
      }),
    );

    const newTree = await api.post(`/repos/${owner}/${repo}/git/trees`, {
      base_tree: baseTreeSha,
      tree,
    });
    const commit = await api.post(`/repos/${owner}/${repo}/git/commits`, {
      message,
      tree: newTree.data.sha,
      parents: [baseCommitSha],
    });
    await api.patch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      sha: commit.data.sha,
    });
    return commit.data.sha as string;
  } catch (err) {
    throw new UpstreamError('GitHub push failed');
  }
}

/** Read a file's text from the repo (returns null if absent). */
export async function readFile(
  token: string,
  repoFullName: string,
  path: string,
  branch: string,
): Promise<string | null> {
  const api = githubApi(token);
  const { owner, repo } = splitRepo(repoFullName);
  try {
    const res = await api.get(`/repos/${owner}/${repo}/contents/${path}`, {
      params: { ref: branch },
    });
    return Buffer.from(res.data.content, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}

/** List recent commits for the repo view. */
export async function listCommits(
  token: string,
  repoFullName: string,
  limit = 20,
): Promise<CommitInfo[]> {
  const api = githubApi(token);
  const { owner, repo } = splitRepo(repoFullName);
  try {
    const res = await api.get(`/repos/${owner}/${repo}/commits`, { params: { per_page: limit } });
    return (res.data as Array<{ sha: string; commit: { message: string; committer: { date: string } } }>).map(
      (c) => ({ sha: c.sha.slice(0, 7), message: c.commit.message, committedAt: c.commit.committer.date }),
    );
  } catch {
    return [];
  }
}
