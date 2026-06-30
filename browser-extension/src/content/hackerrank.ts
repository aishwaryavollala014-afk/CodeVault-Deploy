import type { CapturedSubmission } from '../types';
import { once, readMonaco, sendCapture, text } from '../lib/capture';

// HackerRank content script (Path B v2). Captures the accepted solution from the challenge
// page (no public code API). HackerRank uses a Monaco editor. Best-effort selectors —
// verify on a live "Congrats, you solved this challenge" result.

function parseSlug(): string | null {
  const m = location.pathname.match(/\/challenges\/([^/]+)/);
  return m ? m[1] : null;
}

function isAccepted(): boolean {
  return Array.from(document.querySelectorAll('[class*="congrats"], [class*="success"], span, div')).some(
    (el) => /\b(Congratulations|solved this challenge|Success|All test cases passed)\b/i.test(text(el)),
  );
}

function grabCode(): string | null {
  const monaco = readMonaco();
  if (monaco) return monaco;
  const lines = Array.from(document.querySelectorAll('.view-lines .view-line, .CodeMirror-line'))
    .map((l) => (l as HTMLElement).innerText)
    .join('\n')
    .trim();
  return lines || null;
}

function tryCapture(): void {
  if (!isAccepted()) return;
  const slug = parseSlug();
  if (!slug) return;
  const code = grabCode();
  if (!code) return;
  if (!once(`hackerrank:${slug}`)) return;

  const submission: CapturedSubmission = {
    platform: 'hackerrank',
    number: slug,
    slug,
    title: text(document.querySelector('h1, .challenge-name, [class*="challenge-title"]')) || slug,
    topics: [],
    language:
      text(document.querySelector('[class*="language"], select[class*="lang"] option:checked')) ||
      'unknown',
    code,
    questionMarkdown: '',
    solvedAt: new Date().toISOString(),
    url: `https://www.hackerrank.com/challenges/${slug}/problem`,
  };
  sendCapture(submission);
}

const observer = new MutationObserver(() => tryCapture());
observer.observe(document.body, { childList: true, subtree: true });
console.info('[CodeVault] HackerRank capture active');
