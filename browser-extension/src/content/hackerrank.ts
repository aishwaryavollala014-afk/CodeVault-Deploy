import type { CapturedSubmission } from '../types';
import { once, readMonaco, sendCapture, text } from '../lib/capture';

// HackerRank content script (Path B v2) — mirrors the LeetCode approach:
//   1. Detect a solved/Accepted result in the DOM.
//   2. Fetch the EXACT submitted source from HackerRank's own REST API
//      (`/rest/contests/master/challenges/{slug}/submissions/...`) — full code, any language.
//      The editor read (Monaco) is only a fallback since it can show the template.
//
// ⚠️ REST response shapes + selectors are best-effort — verify on a live "Congratulations,
//    you solved this challenge". Spots marked `VERIFY:` below.

const REST = 'https://www.hackerrank.com/rest/contests/master/challenges';

function parseSlug(): string | null {
  const m = location.pathname.match(/\/challenges\/([^/]+)/);
  return m ? m[1] : null;
}

function isSolved(): boolean {
  return Array.from(
    document.querySelectorAll('[class*="congrats"], [class*="success"], span, div'),
  ).some((el) =>
    /\b(Congratulations|you solved this challenge|All test cases passed)\b/i.test(text(el)),
  );
}

interface HrSubmission {
  id?: number;
  status?: string;
  status_code?: number;
  language?: string;
  code?: string;
}

// VERIFY: list endpoint + `models` array + `status` value ("Accepted") on a live account.
async function fetchAcceptedSource(slug: string): Promise<HrSubmission | null> {
  try {
    const listRes = await fetch(`${REST}/${slug}/submissions/?offset=0&limit=10`, {
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
    if (!listRes.ok) return null;
    const listJson = await listRes.json();
    const models: HrSubmission[] = listJson?.models || [];
    const acc = models.find(
      (m) => /accepted/i.test(m.status || '') || m.status_code === 2,
    );
    if (!acc?.id) return null;

    // VERIFY: detail endpoint returns `model.code` (+ language).
    const detRes = await fetch(`${REST}/${slug}/submissions/${acc.id}`, {
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
    if (!detRes.ok) return acc.code ? acc : null;
    const detJson = await detRes.json();
    const code = (detJson?.model?.code || acc.code || '').trim();
    if (!code) return null;
    return { ...acc, code, language: detJson?.model?.language || acc.language };
  } catch {
    return null;
  }
}

function cleanLang(raw?: string): string {
  const v = String(raw || '').toLowerCase();
  if (/cpp|c\+\+|g\+\+/.test(v)) return 'cpp';
  if (/python|pypy/.test(v)) return 'python3';
  if (/java(?!script)/.test(v)) return 'java';
  if (/javascript|node/.test(v)) return 'javascript';
  if (/\bc\b|c99|c11/.test(v)) return 'c';
  if (/csharp|c#/.test(v)) return 'csharp';
  if (/\bgo\b|golang/.test(v)) return 'go';
  if (/ruby/.test(v)) return 'ruby';
  if (/swift/.test(v)) return 'swift';
  if (/kotlin/.test(v)) return 'kotlin';
  if (/rust/.test(v)) return 'rust';
  if (/scala/.test(v)) return 'scala';
  if (/\bphp\b/.test(v)) return 'php';
  const t = v.replace(/[^a-z0-9+#]/g, '');
  return t && t.length <= 20 ? t : 'unknown';
}

let inFlight = false;
async function tryCapture(): Promise<void> {
  if (inFlight) return;
  const slug = parseSlug();
  if (!slug || !isSolved()) return;
  if (!once(`hackerrank:${slug}`)) return;

  inFlight = true;
  try {
    let code: string | null = null;
    let language = 'unknown';

    const rest = await fetchAcceptedSource(slug);
    if (rest?.code) {
      code = rest.code;
      language = cleanLang(rest.language);
    } else {
      // Fallback: read the editor (may be the template — logged as such).
      code = readMonaco();
      language = cleanLang(
        text(document.querySelector('[class*="language"], select[class*="lang"] option:checked')),
      );
      if (code) console.warn('[CodeVault] HR: REST source unavailable — used editor fallback.');
    }
    if (!code) {
      console.warn('[CodeVault] HR: solved but no source from REST or editor.');
      once(`hackerrank:${slug}`); // allow a retry on next mutation
      return;
    }

    const submission: CapturedSubmission = {
      platform: 'hackerrank',
      number: slug.slice(0, 40),
      slug: slug.slice(0, 200),
      title:
        text(document.querySelector('h1, .challenge-name, [class*="challenge-title"]')) || slug,
      topics: [],
      language,
      code,
      questionMarkdown: '',
      solvedAt: new Date().toISOString(),
      url: `https://www.hackerrank.com/challenges/${slug}/problem`,
    };
    sendCapture(submission);
    console.info(
      `[CodeVault] captured "${submission.title}" (${code.length} chars, ${language}) [${rest?.code ? 'hr-rest' : 'hr-editor'}]`,
    );
  } finally {
    inFlight = false;
  }
}

const observer = new MutationObserver(() => { void tryCapture(); });
observer.observe(document.body, { childList: true, subtree: true });
void tryCapture();
console.info('[CodeVault] HackerRank capture ready — REST submission source');
