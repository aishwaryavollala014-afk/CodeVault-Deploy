import logger from '../../lib/logger';
import { UpstreamError } from '../../utils/errors';
import type { Question, Submission, SubmissionAdapter } from '../../types/sync.types';

// Codeforces server-side code-sync is NOT supported — this was verified, not assumed.
//
// Codeforces' official public API `user.status?handle=X` lists submissions by handle with no
// cookie, BUT it returns only METADATA — never source code. The source lives only on each
// submission's HTML page (`#program-source-text`), and fetching that page server-side is
// blocked by Cloudflare: a plain request returns HTTP 403 ("Just a moment" JS challenge),
// even from a residential IP. Only a real browser can pass the challenge.
//
// → For Codeforces SOURCE, the browser extension (Path B v2, `content/codeforces.ts`) is the
//   correct path: it runs inside the user's logged-in browser, so it clears Cloudflare
//   naturally and can read the submitted code. This adapter therefore degrades safely.
//   (Stats/Path A still use `user.status` in web-backend, which needs metadata only.)
export const codeforcesSubmissionAdapter: SubmissionAdapter = {
  platform: 'codeforces',
  supportsCodeSync: false,

  async getRecentSubmissions(_handle, _opts): Promise<Submission[]> {
    // Source code isn't reachable server-side (API exposes none; source page is Cloudflare-gated).
    logger.warn('Codeforces server-side code-sync unavailable (Cloudflare-gated source); use the extension.');
    return [];
  },

  async getQuestion(slug): Promise<Question> {
    // Problem statements are not available via the official API; provide a link only.
    // slug is expected as "<contestId><index>" e.g. "1700A".
    const m = slug.match(/^(\d+)([A-Za-z]\d?)$/);
    const url = m
      ? `https://codeforces.com/problemset/problem/${m[1]}/${m[2]}`
      : `https://codeforces.com/problemset`;
    if (!m) throw new UpstreamError(`Unrecognized Codeforces problem slug: ${slug}`);
    return {
      slug,
      number: slug,
      title: slug,
      topics: [],
      statementMarkdown: `Problem statement not available via API. See ${url}`,
      url,
    };
  },
};
