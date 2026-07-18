import type { CapturedSubmission } from '../types';
import { htmlToMarkdown, once, readMonaco, sendCapture, text } from '../lib/capture';

// CodeChef content script (Path B v2) — mirrors the LeetCode approach:
//   1. Detect an "Accepted" verdict in the submissions table (or status page).
//   2. Fetch the EXACT submitted source from CodeChef's own `viewplaintext/{solutionId}`
//      endpoint — full code, any language. The Ace/Monaco editor read is only a fallback
//      since it can show the starter template.
//
// ⚠️ Endpoint + selectors are best-effort — verify on a live Accepted submission. CodeChef
//    markup varies between the practice UI and contest UI. Spots marked `VERIFY:` below.

function parseProblemCode(): string | null {
  const m = location.pathname.match(/\/problems\/([A-Za-z0-9_]+)/);
  return m ? m[1] : null;
}

// VERIFY: raw-source endpoint. `viewplaintext/{id}` historically returns the source as text.
async function fetchSource(solutionId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.codechef.com/viewplaintext/${solutionId}`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const body = (await res.text()).trim();
    if (!body) return null;
    // viewplaintext may wrap the code in <pre>…</pre> — strip if present.
    const pre = body.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    const code = (pre ? pre[1] : body)
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .trim();
    return code || null;
  } catch {
    return null;
  }
}

function cleanLang(raw?: string): string {
  const v = String(raw || '').toLowerCase();
  if (/cpp|c\+\+|g\+\+/.test(v)) return 'cpp';
  if (/python|pypy/.test(v)) return 'python3';
  if (/java(?!script)/.test(v)) return 'java';
  if (/\bc\b|c99|gcc/.test(v)) return 'c';
  if (/javascript|node/.test(v)) return 'javascript';
  if (/\bgo\b/.test(v)) return 'go';
  if (/kotlin/.test(v)) return 'kotlin';
  if (/rust/.test(v)) return 'rust';
  if (/ruby/.test(v)) return 'ruby';
  const t = v.replace(/[^a-z0-9+#]/g, '');
  return t && t.length <= 20 ? t : 'unknown';
}

function title(code: string): string {
  return text(document.querySelector('h1, .problem-title, [class*="problem-name"]')) || code;
}

// Full problem statement from CodeChef's problem API (`body` holds the statement).
async function fetchQuestionMarkdown(problemCode: string, titleText: string): Promise<string> {
  try {
    const res = await fetch(`https://www.codechef.com/api/contests/PRACTICE/problems/${problemCode}`, {
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return '';
    const data = await res.json();
    const body = data?.body || data?.problemComponents?.statement || '';
    if (!body) return '';
    return `# ${problemCode}. ${titleText}\n\n${htmlToMarkdown(body)}\n\n[View on CodeChef](https://www.codechef.com/problems/${problemCode})\n`;
  } catch {
    return '';
  }
}

async function emit(problemCode: string, code: string, language: string): Promise<void> {
  const titleText = title(problemCode).slice(0, 300);
  const submission: CapturedSubmission = {
    platform: 'codechef',
    number: problemCode.slice(0, 40),
    slug: problemCode.slice(0, 200),
    title: titleText,
    topics: [],
    language,
    code,
    questionMarkdown: await fetchQuestionMarkdown(problemCode, titleText),
    solvedAt: new Date().toISOString(),
    url: `https://www.codechef.com/problems/${problemCode}`,
  };
  sendCapture(submission);
  // Notify the health monitor that capture is working — resets degraded badge.
  try {
    chrome.runtime.sendMessage({ type: 'captureSuccess', platform: 'codechef' }).catch(() => {});
  } catch { /* context invalidated */ }
  console.info(`[CodeVault] captured "${submission.title}" (${code.length} chars, ${language}) [cc]`);
}

// Path 1: submissions table — find an Accepted row + its /viewsolution/{id} link.
async function scanSubmissionsTable(problemCode: string): Promise<boolean> {
  // VERIFY: row/verdict selectors on the submissions table (practice + contest UIs differ).
  const rows = document.querySelectorAll('table tr, [class*="submission"] tr');
  for (const row of Array.from(rows)) {
    const accepted =
      !!row.querySelector('[title*="accepted" i], .icon-tick, [class*="_accepted"]') ||
      /\b(accepted|100)\b/i.test(text(row.querySelector('[class*="result"], td')));
    if (!accepted) continue;
    const link = row.querySelector<HTMLAnchorElement>('a[href*="/viewsolution/"]');
    const sid = link?.getAttribute('href')?.match(/\/viewsolution\/(\d+)/)?.[1];
    if (!sid) continue;
    if (!once(`codechef:${sid}`)) return true;
    const langCell = Array.from(row.querySelectorAll('td')).find((td) =>
      /(c\+\+|python|java|pypy|\bc\b|kotlin|rust|ruby|go)/i.test(text(td)),
    );
    const code = await fetchSource(sid);
    if (!code) {
      console.warn(`[CodeVault] CC: accepted sol ${sid} but no source from viewplaintext.`);
      return true;
    }
    await emit(problemCode, code, cleanLang(text(langCell)));
    return true;
  }
  return false;
}

// Accepted verdict text — covers standard practice ("Accepted"/"(100)") AND the Learn course
// ("Excellent work!", "test cases passed").
const ACCEPT_RE = /\b(Accepted|Correct Answer|\(100\)|Excellent work|All (?:test )?cases? passed|test cases? passed)\b/i;

// Best-effort editor read from the isolated world: Monaco global (if reachable) → visible Ace
// lines. NOTE: CodeChef's Learn course uses an Ace editor whose full value lives on the page's
// `window.ace` global, which an isolated content script can't read — so only the *visible* lines
// are captured here. Full support needs a MAIN-world hook like LeetCode's `leetcode-inject.ts`.
function readEditorCode(): string | null {
  const monaco = readMonaco();
  if (monaco) return monaco;
  const aceLines = Array.from(document.querySelectorAll('.ace_line'))
    .map((l) => (l as HTMLElement).innerText)
    .join('\n')
    .trim();
  return aceLines || null;
}

// Path 2: fallback — read the editor on the problem page (standard flow + Learn course).
async function scanEditor(problemCode: string): Promise<void> {
  const accepted = Array.from(document.querySelectorAll('[class*="result"], [class*="verdict"], span, div, td'))
    .some((el) => ACCEPT_RE.test(text(el)));
  if (!accepted) {
    console.info('[CodeVault] CC: on', problemCode, '— no accepted verdict detected yet.');
    return;
  }
  if (!once(`codechef:${problemCode}:editor`)) return;
  const code = readEditorCode();
  if (!code) {
    console.warn('[CodeVault] CC: accepted but could not read editor code (Ace value is page-scoped — needs a MAIN-world hook).');
    once(`codechef:${problemCode}:editor`); // let it retry
    return;
  }
  console.warn(`[CodeVault] CC: editor capture (${code.length} chars) — Learn/practice fallback.`);
  await emit(problemCode, code, cleanLang(text(document.querySelector('[class*="language"]'))));
}

let inFlight = false;
async function tryCapture(): Promise<void> {
  if (inFlight) return;
  const problemCode = parseProblemCode();
  if (!problemCode) return;
  inFlight = true;
  try {
    const gotFromTable = await scanSubmissionsTable(problemCode);
    if (!gotFromTable) await scanEditor(problemCode);
  } finally {
    inFlight = false;
  }
}

const observer = new MutationObserver(() => { void tryCapture(); });
observer.observe(document.body, { childList: true, subtree: true });
void tryCapture();
console.info('[CodeVault] CodeChef capture ready — viewplaintext source');
