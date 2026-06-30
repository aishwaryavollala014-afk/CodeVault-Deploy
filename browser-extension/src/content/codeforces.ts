import type { CapturedSubmission } from '../types';
import { once, sendCapture, text } from '../lib/capture';

// Codeforces content script (Path B v2). On a user's own submission page the source code
// is rendered in <pre id="program-source-text">, so unlike the API path (which exposes no
// source), the extension CAN capture it directly from the page the user is viewing.
// Best-effort selectors — verify on a live submission page.

function isAccepted(): boolean {
  if (document.querySelector('.verdict-accepted')) return true;
  return Array.from(document.querySelectorAll('.verdict, span.verdict-accepted, td')).some((el) =>
    /\bAccepted\b/i.test(text(el)),
  );
}

function grabCode(): string | null {
  const pre = document.querySelector('#program-source-text');
  const code = (pre as HTMLElement | null)?.innerText?.trim();
  return code || null;
}

function grabProblem(): { number: string; slug: string; title: string } | null {
  const link = document.querySelector<HTMLAnchorElement>('a[href*="/problem/"]');
  if (!link) return null;
  const m = link.getAttribute('href')!.match(/\/(?:contest|gym|problemset\/problem)\/(\d+)\/(?:problem\/)?([A-Za-z]\d?)/);
  if (!m) return null;
  const id = `${m[1]}${m[2].toUpperCase()}`; // e.g. "1700A"
  const title = text(link).replace(/^[A-Za-z]\d?\s*[-.]\s*/, '') || id;
  return { number: id, slug: id, title };
}

function grabLanguage(): string {
  // Submission detail tables list the language in a cell; fall back to "unknown".
  const cell = Array.from(document.querySelectorAll('td')).find((td) =>
    /\b(GNU|Clang|Python|PyPy|Java|Kotlin|Rust|Go|C#|JavaScript)\b/i.test(text(td)),
  );
  return text(cell) || 'unknown';
}

function tryCapture(): void {
  if (!isAccepted()) return;
  const code = grabCode();
  if (!code) return;
  const prob = grabProblem();
  if (!prob) return;
  if (!once(`codeforces:${prob.slug}`)) return;

  const submission: CapturedSubmission = {
    platform: 'codeforces',
    number: prob.number,
    slug: prob.slug,
    title: prob.title,
    topics: [],
    language: grabLanguage(),
    code,
    questionMarkdown: '',
    solvedAt: new Date().toISOString(),
    url: `https://codeforces.com/problemset/problem/${prob.number.replace(/([A-Za-z]\d?)$/, '/$1')}`,
  };
  sendCapture(submission);
}

const observer = new MutationObserver(() => tryCapture());
observer.observe(document.body, { childList: true, subtree: true });
tryCapture(); // submission pages render server-side, so try once immediately
console.info('[CodeVault] Codeforces capture active');
