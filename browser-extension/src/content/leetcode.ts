import type { CapturedSubmission, Difficulty } from '../types';
import { once, sendCapture, text } from '../lib/capture';

// LeetCode content script (Path B v2). Watches for an "Accepted" verdict, then captures
// the problem metadata + submitted code from the DOM and forwards it to the background.
// NOTE: LeetCode is a SPA with no public API; selectors are best-effort and need live
// verification (they change over time). The server fills the statement if questionMarkdown is empty.

const DIFF: Record<string, Difficulty> = { easy: 'easy', medium: 'medium', hard: 'hard' };

function parseSlug(): string | null {
  const m = location.pathname.match(/\/problems\/([^/]+)/);
  return m ? m[1] : null;
}

function isAccepted(): boolean {
  return Array.from(
    document.querySelectorAll('[data-e2e-locator="submission-result"], span, div'),
  ).some((el) => /^Accepted$/i.test(text(el)));
}

// Read the visible Monaco editor lines (isolated-world-safe DOM read).
function grabCode(): string | null {
  const lines = Array.from(document.querySelectorAll('.view-lines .view-line')).map(
    (l) => (l as HTMLElement).innerText,
  );
  const code = lines.join('\n').trim();
  return code || null;
}

function grabMeta() {
  const slug = parseSlug();
  if (!slug) return null;
  const titleRaw =
    text(document.querySelector('[data-cy="question-title"]')) ||
    text(document.querySelector('.text-title-large a')) ||
    slug;
  const numMatch = titleRaw.match(/^(\d+)\./);
  const number = numMatch ? numMatch[1] : slug;
  const title = titleRaw.replace(/^\d+\.\s*/, '');
  const diffText = (
    text(document.querySelector('[class*="text-difficulty"]')) || ''
  ).toLowerCase();
  const difficulty = DIFF[diffText];
  const topics = Array.from(document.querySelectorAll('a[href^="/tag/"]'))
    .map((t) => text(t))
    .filter(Boolean);
  const language = text(document.querySelector('[data-mode-id], button[id*="listbox-button"]')) || 'unknown';
  return { slug, number, title, difficulty, topics, language };
}

function tryCapture(): void {
  if (!isAccepted()) return;
  const meta = grabMeta();
  if (!meta) return;
  const code = grabCode();
  if (!code) return;
  if (!once(`leetcode:${meta.slug}`)) return;

  const submission: CapturedSubmission = {
    platform: 'leetcode',
    number: meta.number.replace(/\D/g, '') || meta.slug,
    slug: meta.slug,
    title: meta.title,
    difficulty: meta.difficulty,
    topics: meta.topics,
    language: meta.language,
    code,
    questionMarkdown: '',
    solvedAt: new Date().toISOString(),
    url: `https://leetcode.com/problems/${meta.slug}/`,
  };
  sendCapture(submission);
}

const observer = new MutationObserver(() => tryCapture());
observer.observe(document.body, { childList: true, subtree: true });
console.info('[CodeVault] LeetCode capture active');
