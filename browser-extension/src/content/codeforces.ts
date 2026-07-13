import type { CapturedSubmission } from '../types';
import { once, sendCapture, text } from '../lib/capture';

// Codeforces content script (Path B v2) — mirrors the LeetCode approach:
//   1. Detect an "Accepted" verdict in the DOM (submissions status table OR a single
//      submission page). A repeated scan burst catches the verdict as CF updates it from
//      "Running" → "Accepted" live, so no manual hard-refresh is needed.
//   2. Fetch the EXACT submitted source from Codeforces' own same-origin `/data/submitSource`
//      AJAX endpoint (full code, any language). Falls back to <pre id="program-source-text">.
//   3. Fetch the full problem statement from the problem page (same-origin, so it clears
//      Cloudflare) → real question.md with legend + input/output spec + samples.

function cleanCfLang(raw?: string): string {
  const v = String(raw || '').toLowerCase();
  if (/g\+\+|gnu c\+\+|clang\+\+|\bc\+\+\b/.test(v)) return 'cpp';
  if (/gnu c\b|clang c\b|\bc11\b/.test(v)) return 'c';
  if (/pypy|python/.test(v)) return 'python3';
  if (/java(?!script)/.test(v)) return 'java';
  if (/kotlin/.test(v)) return 'kotlin';
  if (/rust/.test(v)) return 'rust';
  if (/\bgo\b|golang/.test(v)) return 'go';
  if (/c#|\.net|mono|csharp/.test(v)) return 'csharp';
  if (/javascript|node/.test(v)) return 'javascript';
  if (/typescript/.test(v)) return 'typescript';
  if (/ruby/.test(v)) return 'ruby';
  if (/scala/.test(v)) return 'scala';
  if (/\bphp\b/.test(v)) return 'php';
  if (/haskell/.test(v)) return 'haskell';
  if (/pascal|fpc|delphi/.test(v)) return 'pascal';
  const token = v.replace(/[^a-z0-9+#]/g, '');
  return token && token.length <= 20 ? token : 'unknown';
}

function csrfToken(): string {
  return (
    document.querySelector<HTMLInputElement>('input[name="csrf_token"]')?.value ||
    document.querySelector<HTMLMetaElement>('meta[name="X-Csrf-Token"]')?.content ||
    ''
  );
}

function parseProblem(href: string | null | undefined): { number: string; url: string } | null {
  if (!href) return null;
  const m = href.match(/\/(?:contest|gym|problemset\/problem)\/(\d+)\/(?:problem\/)?([A-Za-z]\d?)/i);
  if (!m) return null;
  const number = `${m[1]}${m[2].toUpperCase()}`;
  return { number, url: `https://codeforces.com${href}` };
}

async function fetchSource(submissionId: string): Promise<string | null> {
  try {
    const res = await fetch('https://codeforces.com/data/submitSource', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-csrf-token': csrfToken() },
      body: new URLSearchParams({ submissionId, csrf_token: csrfToken() }).toString(),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { source?: string };
    return (json?.source || '').trim() || null;
  } catch {
    return null;
  }
}

// LeetCode-style light HTML→Markdown so question.md is readable (GitHub also renders raw HTML).
function htmlToMarkdown(html: string): string {
  return html
    .replace(/<\/?(strong|b)>/gi, '**')
    .replace(/<\/?(em|i)>/gi, '_')
    .replace(/<pre[^>]*>/gi, '\n```\n')
    .replace(/<\/pre>/gi, '\n```\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(p|div|ul|ol|h[1-6]|section)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\$\$\$/g, '$')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Fetch the full statement from the problem page (same-origin → clears Cloudflare in-browser).
async function fetchQuestionMarkdown(problemUrl: string, number: string, title: string): Promise<string> {
  try {
    const res = await fetch(problemUrl, { credentials: 'include' });
    if (!res.ok) return '';
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const stmt = doc.querySelector('.problem-statement');
    if (!stmt) return '';
    const md = htmlToMarkdown(stmt.innerHTML);
    return `# ${number}. ${title}\n\n${md}\n\n[View on Codeforces](${problemUrl})\n`;
  } catch {
    return '';
  }
}

async function emit(p: {
  number: string;
  title: string;
  language: string;
  code: string;
  url: string;
}): Promise<void> {
  const questionMarkdown = await fetchQuestionMarkdown(p.url, p.number, p.title);
  const submission: CapturedSubmission = {
    platform: 'codeforces',
    number: p.number.slice(0, 40),
    slug: p.number.slice(0, 200),
    title: p.title.slice(0, 300),
    topics: [],
    language: p.language,
    code: p.code,
    questionMarkdown,
    solvedAt: new Date().toISOString(),
    url: p.url,
  };
  sendCapture(submission);
  console.info(`[CodeVault] captured "${submission.title}" (${p.code.length} chars, ${submission.language}) [cf]`);
}

// Path 1: submissions status table — each accepted row has a submission id + problem link.
async function scanStatusTable(): Promise<void> {
  const rows = document.querySelectorAll<HTMLTableRowElement>('tr[data-submission-id], tr[data-submissionid]');
  for (const row of Array.from(rows)) {
    const accepted =
      !!row.querySelector('.verdict-accepted') ||
      Array.from(row.querySelectorAll('.verdict, span, td')).some((el) => /^accepted\b/i.test(text(el)));
    if (!accepted) continue;
    const sid = row.getAttribute('data-submission-id') || row.getAttribute('data-submissionid') || '';
    if (!sid) continue;
    if (!once(`codeforces:${sid}`)) continue;

    const link = row.querySelector<HTMLAnchorElement>('a[href*="/problem/"]');
    const prob = parseProblem(link?.getAttribute('href'));
    if (!prob) continue;
    const title = text(link).replace(/^[A-Za-z]\d?\s*[-.]\s*/, '') || prob.number;
    const langCell = Array.from(row.querySelectorAll('td')).find((td) =>
      /(g\+\+|gnu|clang|pypy|python|java|kotlin|rust|\bgo\b|c#|mono|\.net|javascript|node|ruby|scala|php|haskell|pascal)/i.test(text(td)),
    );
    const code = await fetchSource(sid);
    if (!code) {
      console.warn(`[CodeVault] CF: accepted ${prob.number} (sub ${sid}) but no source from submitSource.`);
      continue;
    }
    await emit({ number: prob.number, title, language: cleanCfLang(text(langCell)), code, url: prob.url });
  }
}

// Path 2: single submission page (source rendered in #program-source-text).
async function scanSubmissionPage(): Promise<void> {
  const pre = document.querySelector<HTMLElement>('#program-source-text');
  const pageCode = pre?.innerText?.trim();
  if (!pageCode) return;
  const link = document.querySelector<HTMLAnchorElement>('a[href*="/problem/"]');
  const prob = parseProblem(link?.getAttribute('href'));
  if (!prob) return;
  const sidMatch = location.pathname.match(/\/submission\/(\d+)/);
  if (!once(`codeforces:${sidMatch?.[1] || prob.number}:page`)) return;
  const langCell = Array.from(document.querySelectorAll('td')).find((td) =>
    /(g\+\+|gnu|clang|pypy|python|java|kotlin|rust|\bgo\b|c#|javascript|ruby|scala|php)/i.test(text(td)),
  );
  const title = text(link).replace(/^[A-Za-z]\d?\s*[-.]\s*/, '') || prob.number;
  await emit({ number: prob.number, title, language: cleanCfLang(text(langCell)), code: pageCode, url: prob.url });
}

let inFlight = false;
async function tryCapture(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    await scanStatusTable();
    await scanSubmissionPage();
  } finally {
    inFlight = false;
  }
}

// A burst of checks catches the verdict as CF updates "Running" → "Accepted" live — so the
// user never has to hard-refresh. Runs on load, tab focus, and SPA-ish navigation.
function scanBurst(): void {
  let n = 0;
  const iv = setInterval(() => {
    void tryCapture();
    if (++n >= 12) clearInterval(iv);
  }, 1000);
}

const observer = new MutationObserver(() => { void tryCapture(); });
observer.observe(document.documentElement, { childList: true, subtree: true });

let lastPath = location.pathname;
setInterval(() => {
  if (location.pathname !== lastPath) { lastPath = location.pathname; scanBurst(); }
}, 1000);
window.addEventListener('focus', scanBurst);
document.addEventListener('visibilitychange', () => { if (!document.hidden) scanBurst(); });

scanBurst();
console.info('[CodeVault] Codeforces capture ready — submitSource + full statement, no refresh');
