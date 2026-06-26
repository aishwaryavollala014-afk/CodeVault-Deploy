import axios, { type AxiosInstance } from 'axios';

/**
 * Returns an axios instance authenticated as the user's GitHub token, scoped to
 * the GitHub REST API. The token is held in memory only for the call's lifetime.
 */
export function githubApi(token: string): AxiosInstance {
  return axios.create({
    baseURL: 'https://api.github.com',
    timeout: 20_000,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'CodeVault',
    },
  });
}
