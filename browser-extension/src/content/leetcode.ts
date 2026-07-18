import type { CapturedSubmission, Difficulty } from '../types';
import { sendCapture, text } from '../lib/capture';

// LeetCode content script (isolated world, Path B v2).
// Detects an "Accepted" verdict in the DOM, then fetches the EXACT submitted code from
// LeetCode's own `submissionDetails` GraphQL (the canonical source — works for every
// language, no truncation). The old Monaco read could return the starter template, so it's
// only a last-resort fallback. Auto-re-scans on SPA nav / focus so no hard refresh is needed.

const DIFF: Record<string, Difficulty> = { easy: 'easy', medium: 'medium', hard: 'hard' };

const LANG_MAP: Record<string, string> = {
  cpp: 'cpp', c: 'c', java: 'java', python: 'python', python3: 'python3',
  javascript: 'javascript', typescript: 'typescript', csharp: 'csharp',
  go: 'go', golang: 'go', kotlin: 'kotlin', swift: 'swift', rust: 'rust',
  ruby: 'ruby', scala: 'scala', php: 'php', racket: 'racket', erlang: 'erlang',
  elixir: 'elixir', dart: 'dart', mysql: 'mysql', mssql: 'mssql', oraclesql: 'sql',
  postgresql: 'postgresql', pythondata: 'python',
};

const sent = new Set<string>();
let pendingLang: string | undefined;
let pendingSubmissionId: string | undefined;
let inFlight = false;

function parseSlug(): string | null {
  const m = location.pathname.match(/\/problems\/([^/]+)/);
  return m ? m[1] : null;
}
function submissionIdFromUrl(): string {
  const m = location.pathname.match(/\/submissions\/(\d+)/);
  return m ? m[1] : '';
}
function csrfToken(): string {
  return (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || '';
}
function cleanLang(raw?: string): string {
  const v = String(raw || '').toLowerCase().trim();
  return LANG_MAP[v] || (/^[a-z0-9+#.]{1,20}$/.test(v) ? v : 'unknown');
}

function detectAccepted(): boolean {
  const el = document.querySelector('[data-e2e-locator="submission-result"]');
  if (el && /accepted/i.test(text(el))) return true;
  return Array.from(document.querySelectorAll('span, div, h3, h4')).some(
    (n) => /^accepted$/i.test(text(n)) && (n as HTMLElement).offsetParent !== null,
  );
}

interface SubmissionDetails {
  code?: string;
  lang?: { name?: string };
  question?: {
    questionFrontendId?: string;
    titleSlug?: string;
    title?: string;
    difficulty?: string;
    topicTags?: Array<{ name?: string }>;
  };
}

// Fetch the user's actual submitted code (same-origin, session cookie authorizes it).
async function fetchSubmissionDetails(submissionId: string): Promise<SubmissionDetails | null> {
  try {
    const res = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', 'x-csrftoken': csrfToken() },
      body: JSON.stringify({
        operationName: 'submissionDetails',
        variables: { submissionId: Number(submissionId) },
        query:
          'query submissionDetails($submissionId: Int!) { submissionDetails(submissionId: $submissionId) { code lang { name } question { questionFrontendId titleSlug title difficulty topicTags { name } } } }',
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data?.submissionDetails as SubmissionDetails) ?? null;
  } catch {
    return null;
  }
}

async function gql<T>(operationName: string, query: string, variables: object): Promise<T | null> {
  try {
    const res = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', 'x-csrftoken': csrfToken() },
      body: JSON.stringify({ operationName, query, variables }),
    });
    if (!res.ok) return null;
    return ((await res.json())?.data as T) ?? null;
  } catch {
    return null;
  }
}

// Full problem statement (HTML) → lightly cleaned Markdown for question.md.
// Includes description, examples, and the input/output format LeetCode ships in `content`.
async function fetchQuestionMarkdown(slug: string, number: string, title: string): Promise<string> {
  const data = await gql<{ question?: { content?: string } }>(
    'questionContent',
    'query questionContent($titleSlug: String!) { question(titleSlug: $titleSlug) { content } }',
    { titleSlug: slug },
  );
  const html = data?.question?.content || '';
  if (!html) return '';
  const md = htmlToMarkdown(html);
  return `# ${number}. ${title}\n\n${md}\n\n[View on LeetCode](https://leetcode.com/problems/${slug}/)\n`;
}

// LeetCode's `content` is HTML. GitHub renders inline HTML in .md, but a light conversion
// yields cleaner diffs and readable examples/constraints.
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?(strong|b)>/gi, '**')
    .replace(/<\/?(em|i)>/gi, '_')
    .replace(/<\/?code>/gi, '`')
    .replace(/<pre[^>]*>/gi, '\n```\n')
    .replace(/<\/pre>/gi, '\n```\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/(p|div|ul|ol|h[1-6])>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Find the user's latest ACCEPTED submission id for a problem — used when the page has no
// submission id in the URL (e.g. the /description/ tab), so we still fetch the real code
// instead of falling back to the editor template.
async function latestAcceptedSubmissionId(slug: string): Promise<string> {
  const data = await gql<{ questionSubmissionList?: { submissions?: Array<{ id?: string | number; statusDisplay?: string }> } }>(
    'submissionList',
    'query submissionList($offset: Int!, $limit: Int!, $questionSlug: String!) { questionSubmissionList(offset: $offset, limit: $limit, questionSlug: $questionSlug) { submissions { id statusDisplay } } }',
    { offset: 0, limit: 20, questionSlug: slug },
  );
  const subs = data?.questionSubmissionList?.submissions || [];
  const acc = subs.find((s) => /accepted/i.test(s.statusDisplay || ''));
  return acc?.id ? String(acc.id) : '';
}

async function captureViaGraphQL(submissionId: string): Promise<boolean> {
  const d = await fetchSubmissionDetails(submissionId);
  const code = (d?.code || '').trim();
  if (!code) return false;
  const q = d!.question || {};
  const slug = q.titleSlug || parseSlug() || 'unknown';
  const number = String(q.questionFrontendId || slug).slice(0, 40);
  const title = (q.title || slug).slice(0, 300);
  const questionMarkdown = await fetchQuestionMarkdown(slug, number, title);
  const submission: CapturedSubmission = {
    platform: 'leetcode',
    number,
    slug: slug.slice(0, 200),
    title,
    difficulty: DIFF[String(q.difficulty || '').toLowerCase()],
    topics: (q.topicTags || []).map((t) => t.name || '').filter(Boolean).slice(0, 40),
    language: cleanLang(d!.lang?.name || pendingLang),
    code,
    questionMarkdown,
    solvedAt: new Date().toISOString(),
    url: `https://leetcode.com/problems/${slug}/`,
  };
  sendCapture(submission);
  // Notify the health monitor that capture is working — resets degraded badge.
  try {
    chrome.runtime.sendMessage({ type: 'captureSuccess', platform: 'leetcode' }).catch(() => {});
  } catch { /* context invalidated */ }
  console.info(`[CodeVault] captured "${submission.title}" (${code.length} chars, ${submission.language}) [graphql]`);
  return true;
}

function grabMetaForFallback() {
  const slug = parseSlug();
  if (!slug) return null;
  const titleRaw =
    text(document.querySelector('[data-cy="question-title"]')) ||
    text(document.querySelector('.text-title-large a')) ||
    text(document.querySelector(`a[href^="/problems/${slug}"]`)) ||
    slug;
  const number = (titleRaw.match(/^(\d+)\./)?.[1]) || '';
  const title = titleRaw.replace(/^\d+\.\s*/, '').trim() || slug;
  const diffText = (text(document.querySelector('[class*="text-difficulty"]')) || '').toLowerCase();
  const topics = Array.from(document.querySelectorAll('a[href^="/tag/"]')).map((t) => text(t)).filter(Boolean).slice(0, 40);
  return { slug, number, title, difficulty: DIFF[diffText], topics };
}

async function tryCapture(): Promise<void> {
  if (inFlight) return;
  const slug = parseSlug();
  if (!slug || !detectAccepted()) return;

  inFlight = true;
  try {
    // Resolve a submission id: URL → sniffed check-response → the latest ACCEPTED submission
    // for this problem (so /description/ and re-visits still get the REAL code, not the editor
    // template). Only fall back to Monaco if GraphQL truly yields nothing.
    let sid = submissionIdFromUrl() || pendingSubmissionId || '';
    if (!sid) sid = await latestAcceptedSubmissionId(slug);

    const key = `leetcode:${slug}:${sid || 'nosid'}`;
    if (sent.has(key)) return;

    if (sid) {
      sent.add(key);
      const ok = await captureViaGraphQL(sid);
      if (!ok) {
        sent.delete(key);
        window.postMessage({ __cv: 'get-code' }, '*'); // GraphQL failed → try Monaco
      }
    } else {
      window.postMessage({ __cv: 'get-code' }, '*'); // no submission id → Monaco fallback
    }
  } finally {
    inFlight = false;
  }
}

// Messages from the MAIN-world hook.
window.addEventListener('message', (ev: MessageEvent) => {
  const d = ev.data as { __cv?: string; code?: string | null; lang?: string; submissionId?: string };
  if (ev.source !== window || !d?.__cv) return;

  if (d.__cv === 'accepted') {
    if (d.lang) pendingLang = d.lang;
    if (d.submissionId) pendingSubmissionId = d.submissionId;
    void tryCapture();
    return;
  }

  // Monaco fallback code (only used when GraphQL is unavailable).
  if (d.__cv === 'code') {
    const meta = grabMetaForFallback();
    if (!meta) return;
    const code = (d.code || '').trim();
    if (!code) {
      console.warn('[CodeVault] Accepted but no code from GraphQL or Monaco.');
      return;
    }
    const key = `leetcode:${meta.slug}:fallback`;
    if (sent.has(key)) return;
    sent.add(key);
    const submission: CapturedSubmission = {
      platform: 'leetcode',
      number: (meta.number || meta.slug).slice(0, 40),
      slug: meta.slug.slice(0, 200),
      title: meta.title.slice(0, 300),
      difficulty: meta.difficulty,
      topics: meta.topics,
      language: cleanLang(pendingLang || d.lang),
      code,
      questionMarkdown: '',
      solvedAt: new Date().toISOString(),
      url: `https://leetcode.com/problems/${meta.slug}/`,
    };
    sendCapture(submission);
    // Notify the health monitor
    try {
      chrome.runtime.sendMessage({ type: 'captureSuccess', platform: 'leetcode' }).catch(() => {});
    } catch { /* context invalidated */ }
    console.info(`[CodeVault] captured "${meta.title}" (${code.length} chars, ${submission.language}) [monaco-fallback]`);
  }
});

// A short burst of checks — verdict/editor can render a moment after the DOM mutates.
function scanBurst(): void {
  let n = 0;
  const iv = setInterval(() => { void tryCapture(); if (++n >= 8) clearInterval(iv); }, 700);
}

// 1) Verdict appearing in the DOM.
const observer = new MutationObserver(() => { void tryCapture(); });
observer.observe(document.documentElement, { childList: true, subtree: true });

// 2) SPA navigation (LeetCode swaps problems without a full reload) — poll & re-scan.
let lastPath = location.pathname;
setInterval(() => {
  if (location.pathname !== lastPath) {
    lastPath = location.pathname;
    pendingSubmissionId = undefined;
    scanBurst();
  }
}, 1000);

// 3) Returning to the tab — re-scan.
window.addEventListener('focus', scanBurst);
document.addEventListener('visibilitychange', () => { if (!document.hidden) scanBurst(); });

scanBurst();
console.info('[CodeVault] LeetCode capture ready — GraphQL code, all languages, no refresh');
