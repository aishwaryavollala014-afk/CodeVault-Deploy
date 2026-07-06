import type { CapturedSubmission, Difficulty } from '../types';
import { sendCapture, text } from '../lib/capture';

// LeetCode content script (isolated world, Path B v2).
// Detection strategy: watch the DOM for an "Accepted" verdict (reliable, survives SPA nav),
// then ask the MAIN-world hook (leetcode-inject.ts) for the FULL Monaco code and forward the
// whole submission to the background worker → git-service /api/ingest. Also captures an
// Accepted result that is ALREADY on screen (e.g. viewing a submission), so no re-submit needed.

const DIFF: Record<string, Difficulty> = { easy: 'easy', medium: 'medium', hard: 'hard' };

const LANG_MAP: Record<string, string> = {
  cpp: 'cpp', c: 'c', java: 'java', python: 'python', python3: 'python3',
  javascript: 'javascript', typescript: 'typescript', csharp: 'csharp',
  go: 'go', golang: 'go', kotlin: 'kotlin', swift: 'swift', rust: 'rust',
  ruby: 'ruby', scala: 'scala', php: 'php', racket: 'racket', erlang: 'erlang',
  elixir: 'elixir', dart: 'dart', mysql: 'mysql', mssql: 'mssql', oraclesql: 'sql',
};

const sent = new Set<string>();
let pendingLang: string | undefined;
let inFlight = false;

function parseSlug(): string | null {
  const m = location.pathname.match(/\/problems\/([^/]+)/);
  return m ? m[1] : null;
}
function submissionId(): string {
  const m = location.pathname.match(/\/submissions\/(\d+)/);
  return m ? m[1] : '';
}

function detectAccepted(): boolean {
  const el = document.querySelector('[data-e2e-locator="submission-result"]');
  if (el && /accepted/i.test(text(el))) return true;
  // Fallback: a standalone green "Accepted" verdict heading.
  return Array.from(document.querySelectorAll('span, div, h3, h4')).some(
    (n) => /^accepted$/i.test(text(n)) && (n as HTMLElement).offsetParent !== null,
  );
}

function readLangFromDom(): string | undefined {
  const btn =
    text(document.querySelector('button[aria-haspopup="listbox"]')) ||
    text(document.querySelector('[id*="headlessui-listbox-button"]')) ||
    text(document.querySelector('[data-mode-id]'));
  const v = btn.trim().toLowerCase().replace(/\s+/g, '');
  return v || undefined;
}

function grabMeta() {
  const slug = parseSlug();
  if (!slug) return null;
  const titleRaw =
    text(document.querySelector('[data-cy="question-title"]')) ||
    text(document.querySelector('.text-title-large a')) ||
    text(document.querySelector(`a[href^="/problems/${slug}"]`)) ||
    slug;
  const numMatch = titleRaw.match(/^(\d+)\./);
  const number = numMatch ? numMatch[1] : '';
  const title = titleRaw.replace(/^\d+\.\s*/, '').trim() || slug;
  const diffText = (
    text(document.querySelector('[class*="text-difficulty"]')) ||
    text(document.querySelector('[class*="difficulty"]')) ||
    ''
  ).toLowerCase();
  const difficulty = DIFF[diffText];
  const topics = Array.from(document.querySelectorAll('a[href^="/tag/"]'))
    .map((t) => text(t))
    .filter(Boolean)
    .slice(0, 40);
  return { slug, number, title, difficulty, topics };
}

function key(slug: string): string {
  return `leetcode:${slug}:${submissionId()}`;
}

function tryCapture(): void {
  if (inFlight) return;
  const slug = parseSlug();
  if (!slug || sent.has(key(slug))) return;
  if (!detectAccepted()) return;
  inFlight = true;
  // Ask the MAIN-world hook for the full Monaco code.
  window.postMessage({ __cv: 'get-code' }, '*');
}

window.addEventListener('message', (ev: MessageEvent) => {
  const d = ev.data as { __cv?: string; code?: string | null; lang?: string };
  if (ev.source !== window || !d?.__cv) return;

  if (d.__cv === 'accepted') {
    if (d.lang) pendingLang = d.lang;
    tryCapture();
    return;
  }

  if (d.__cv === 'code') {
    inFlight = false;
    const meta = grabMeta();
    if (!meta) return;
    const code = (d.code || '').trim();
    if (!code) {
      console.warn('[CodeVault] Accepted detected but code was empty (Monaco not readable).');
      return;
    }
    const k = key(meta.slug);
    if (sent.has(k)) return;
    sent.add(k);

    const langRaw = String(pendingLang || readLangFromDom() || '').toLowerCase();
    const submission: CapturedSubmission = {
      platform: 'leetcode',
      number: meta.number.replace(/\D/g, '') || meta.slug,
      slug: meta.slug,
      title: meta.title,
      difficulty: meta.difficulty,
      topics: meta.topics,
      language: LANG_MAP[langRaw] || langRaw || 'unknown',
      code,
      questionMarkdown: '',
      solvedAt: new Date().toISOString(),
      url: `https://leetcode.com/problems/${meta.slug}/`,
    };
    sendCapture(submission);
    console.info(`[CodeVault] captured "${meta.title}" (${code.length} chars, ${submission.language})`);
  }
});

// Watch for a verdict appearing, and check once shortly after load (covers a result
// that is already on screen when the page opens).
const observer = new MutationObserver(() => tryCapture());
observer.observe(document.documentElement, { childList: true, subtree: true });
setTimeout(tryCapture, 1200);

console.info('[CodeVault] LeetCode capture ready (DOM verdict + Monaco full-code)');
