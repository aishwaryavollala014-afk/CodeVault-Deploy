import type { CapturedSubmission, Difficulty } from '../types';
import { once, sendCapture, text } from '../lib/capture';

// LeetCode content script (isolated world, Path B v2). The MAIN-world hook
// (leetcode-inject.ts) detects an Accepted submission + reads the FULL Monaco code and
// postMessages it here. This script enriches it with problem metadata from the DOM and
// forwards it to the background worker → git-service /api/ingest. The server fills the
// question statement when questionMarkdown is empty.

const DIFF: Record<string, Difficulty> = { easy: 'easy', medium: 'medium', hard: 'hard' };

// LeetCode language ids → clean names (git-service maps these to file extensions).
const LANG_MAP: Record<string, string> = {
  cpp: 'cpp', c: 'c', java: 'java', python: 'python', python3: 'python3',
  javascript: 'javascript', typescript: 'typescript', csharp: 'csharp',
  go: 'go', golang: 'go', kotlin: 'kotlin', swift: 'swift', rust: 'rust',
  ruby: 'ruby', scala: 'scala', php: 'php', racket: 'racket', erlang: 'erlang',
  elixir: 'elixir', dart: 'dart', mysql: 'mysql', mssql: 'mssql', oraclesql: 'sql',
};

function parseSlug(): string | null {
  const m = location.pathname.match(/\/problems\/([^/]+)/);
  return m ? m[1] : null;
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

window.addEventListener('message', (ev: MessageEvent) => {
  const d = ev.data as {
    __codevault?: string;
    accepted?: boolean;
    code?: string | null;
    lang?: string;
    questionId?: string;
  };
  if (ev.source !== window || d?.__codevault !== 'codevault-lc' || !d.accepted) return;

  const meta = grabMeta();
  if (!meta) return;

  const code = (d.code || '').trim();
  if (!code) {
    console.warn('[CodeVault] Accepted detected but code was empty (Monaco not readable).');
    return;
  }

  const number = meta.number.replace(/\D/g, '') || d.questionId || meta.slug;
  // Dedupe by slug+size so re-submitting an edited solution still syncs.
  if (!once(`leetcode:${meta.slug}:${code.length}`)) return;

  const submission: CapturedSubmission = {
    platform: 'leetcode',
    number,
    slug: meta.slug,
    title: meta.title,
    difficulty: meta.difficulty,
    topics: meta.topics,
    language: LANG_MAP[String(d.lang || '').toLowerCase()] || d.lang || 'unknown',
    code,
    questionMarkdown: '',
    solvedAt: new Date().toISOString(),
    url: `https://leetcode.com/problems/${meta.slug}/`,
  };

  sendCapture(submission);
  console.info(`[CodeVault] captured LeetCode "${meta.title}" (${code.length} chars, ${submission.language})`);
});

console.info('[CodeVault] LeetCode capture ready (network + Monaco full-code)');
