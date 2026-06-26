/** A file to write in a commit. */
export interface GithubFile {
  path: string;
  content: string;
}

export interface RepoRef {
  owner: string;
  repo: string;
  branch: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  committedAt: string;
}

export interface RepoFileEntry {
  number: string;
  title: string;
  language: string;
  path: string;
}
