import type { CapturedSubmission } from '../types';
import { once, sendCapture, text } from '../lib/capture';

// Codeforces content script (Path B v2) — mirrors the LeetCode approach:
//   1. Detect an "Accepted" verdict in the DOM (submissions status table OR a single
//      submission page).
//   2. Fetch the EXACT submitted source from Codeforces' own same-origin `/data/submitSource`
//      AJAX endpoint (the canonical source — full code, any language). The user's session
//      cookie + CSRF token authorize it for their own submissions.
//   3. Fall back to scraping <pre id="program-source-text"> when the source is already on the
//      page (single submission view) and the fetch is unavailable.
// Auto re-scans on SPA-ish nav / focus so no hard refresh is needed.
//
// ⚠️ Selectors + the submitSource response shape are best-effort — verify on a live
//    Codeforces submission before ticking this off. Marked spots below with `VERIFY:`.

// Codeforces language strings are verbose ("GNU G++17", "PyPy 3-64", "Java 8", "Python 3").
// Normalize to a file-ext-friendly token; git-service maps the token → extension.
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
  if (/\bd\b|dmd|gdc/.test(v)) return 'd';
  if (/pascal|fpc|delphi/.test(v)) return 'pascal';
  const token = v.replace(/[^a-z0-9+#]/g, '');
  return token && token.length <= 20 ? token : 'unknown';
}

// CSRF token — present on virtually every authenticated Codeforces page.
function csrfToken(): string {
  return (
    document.querySelector<HTMLInputElement>('input[name="csrf_token"]')?.value ||
    document.querySelector<HTMLMetaElement>('meta[name="X-Csrf-Token"]')?.content ||
    ''
  );
}

// Parse "1700A" style id from a problem link's href (contest/gym/problemset).
function parseProblem(href: string | null | undefined): { number: string; url: string } | null {
  if (!href) return null;
  const m = href.match(/\/(?:contest|gym|problemset\/problem)\/(\d+)\/(?:problem\/)?([A-Za-z]\d?)/i);
  if (!m) return null;
  const number = `${m[1]}${m[2].toUpperCase()}`;
  return { number, url: `https://codeforces.com${href}` };
}

interface SubmitSourceResponse {
  source?: string;
  // Codeforces also returns testCount, verdict, etc. — we only need source.
}

// Fetch the user's real submitted source (same-origin, session + CSRF authorize it).
// VERIFY: endpoint path + form fields + JSON `source` field against a live submission.
async function fetchSource(submissionId: string): Promise<string | null> {
  try {
    const res = await fetch('https://codeforces.com/data/submitSource', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-csrf-token': csrfToken() },
      body: new URLSearchParams({ submissionId, csrf_token: csrfToken() }).toString(),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as SubmitSourceResponse;
    const code = (json?.source || '').trim();
    return code || null;
  } catch {
    return null;
  }
}

// --- Path 1: auto-detect from a submissions status table -----------------------------------
// Each accepted row exposes a submission id, a problem link, and a language cell.
async function scanStatusTable(): Promise<void> {
  // VERIFY: row selector + verdict/language cells on /contest/{id}/my and /problemset/status.
  const rows = document.querySelectorAll<HTMLTableRowElement>('tr[data-submission-id], tr[data-submissionid]');
  for (const row of Array.from(rows)) {
    const accepted =
      !!row.querySelector('.verdict-accepted') ||
      Array.from(row.querySelectorAll('.verdict, span, td')).some((el) => /^accepted\b/i.test(text(el)));
    if (!accepted) continue;

    const sid = row.getAttribute('data-submission-id') || row.getAttribute('data-submissionid') || '';
    if (!sid) continue;
    const key = `codeforces:${sid}`;
    if (!once(key)) continue;

    const link = row.querySelector<HTMLAnchorElement>('a[href*="/problem/"]');
    const prob = parseProblem(link?.getAttribute('href'));
    if (!prob) continue;
    const title = text(link).replace(/^[A-Za-z]\d?\s*[-.]\s*/, '') || prob.number;

    // Language cell: pick the cell whose text looks like a CF language string.
    const langCell = Array.from(row.querySelectorAll('td')).find((td) =>
      /(g\+\+|gnu|clang|pypy|python|java|kotlin|rust|\bgo\b|c#|mono|\.net|javascript|node|ruby|scala|php|haskell|pascal)/i.test(
        text(td),
      ),
    );

    const code = await fetchSource(sid);
    if (!code) {
      console.warn(`[CodeVault] CF: accepted ${prob.number} (sub ${sid}) but no source from submitSource.`);
      continue;
    }
    emit({ number: prob.number, title, language: cleanCfLang(text(langCell)), code, url: prob.url });
  }
}

// --- Path 2: single submission page (source already rendered) ------------------------------
async function scanSubmissionPage(): Promise<void> {
  const pre = document.querySelector<HTMLElement>('#program-source-text');
  const pageCode = pre?.innerText?.trim();
  if (!pageCode) return;
  const link = document.querySelector<HTMLAnchorElement>('a[href*="/problem/"]');
  const prob = parseProblem(link?.getAttribute('href'));
  if (!prob) return;
  const sidMatch = location.pathname.match(/\/submission\/(\d+)/);
  const key = `codeforces:${sidMatch?.[1] || prob.number}:page`;
  if (!once(key)) return;

  const langCell = Array.from(document.querySelectorAll('td')).find((td) =>
    /(g\+\+|gnu|clang|pypy|python|java|kotlin|rust|\bgo\b|c#|javascript|ruby|scala|php)/i.test(text(td)),
  );
  const title = text(link).replace(/^[A-Za-z]\d?\s*[-.]\s*/, '') || prob.number;
  emit({ number: prob.number, title, language: cleanCfLang(text(langCell)), code: pageCode, url: prob.url });
}

function emit(p: { number: string; title: string; language: string; code: string; url: string }): void {
  const submission: CapturedSubmission = {
    platform: 'codeforces',
    number: p.number.slice(0, 40),
    slug: p.number.slice(0, 200),
    title: p.title.slice(0, 300),
    topics: [],
    language: p.language,
    code: p.code,
    questionMarkdown: '',
    solvedAt: new Date().toISOString(),
    url: p.url,
  };
  sendCapture(submission);
  console.info(`[CodeVault] captured "${submission.title}" (${p.code.length} chars, ${submission.language}) [cf]`);
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

// Verdicts / tables render server-side but also update live after a submit — observe + poll.
const observer = new MutationObserver(() => { void tryCapture(); });
observer.observe(document.documentElement, { childList: true, subtree: true });

let lastPath = location.pathname;
setInterval(() => {
  if (location.pathname !== lastPath) { lastPath = location.pathname; void tryCapture(); }
}, 1500);
window.addEventListener('focus', () => { void tryCapture(); });

void tryCapture();
console.info('[CodeVault] Codeforces capture ready — submitSource fetch, all languages');
