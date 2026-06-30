import type { CapturedSubmission } from '../types';
import { once, readMonaco, sendCapture, text } from '../lib/capture';

// CodeChef content script (Path B v2). Captures the accepted solution from the page the
// user is on (no public code API exists). CodeChef uses an Ace/Monaco editor; selectors
// are best-effort and need live verification.

function parseCode(): string | null {
  const m = location.pathname.match(/\/problems\/([A-Za-z0-9_]+)/);
  return m ? m[1] : null;
}

function isAccepted(): boolean {
  return Array.from(document.querySelectorAll('[class*="result"], span, td')).some((el) =>
    /\b(Accepted|Correct Answer|AC)\b/i.test(text(el)),
  );
}

function grabCode(): string | null {
  // Monaco first; fall back to an Ace editor's text layer.
  const monaco = readMonaco();
  if (monaco) return monaco;
  const ace = Array.from(document.querySelectorAll('.ace_line'))
    .map((l) => (l as HTMLElement).innerText)
    .join('\n')
    .trim();
  return ace || null;
}

function tryCapture(): void {
  if (!isAccepted()) return;
  const code = parseCode();
  if (!code) return;
  const source = grabCode();
  if (!source) return;
  if (!once(`codechef:${code}`)) return;

  const submission: CapturedSubmission = {
    platform: 'codechef',
    number: code,
    slug: code,
    title: text(document.querySelector('h1, .problem-title')) || code,
    topics: [],
    language:
      text(document.querySelector('[class*="language"], select[name*="lang"] option:checked')) ||
      'unknown',
    code: source,
    questionMarkdown: '',
    solvedAt: new Date().toISOString(),
    url: `https://www.codechef.com/problems/${code}`,
  };
  sendCapture(submission);
}

const observer = new MutationObserver(() => tryCapture());
observer.observe(document.body, { childList: true, subtree: true });
console.info('[CodeVault] CodeChef capture active');
