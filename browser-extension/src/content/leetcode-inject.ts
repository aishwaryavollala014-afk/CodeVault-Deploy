// Runs in the PAGE (MAIN) world on LeetCode problem pages. Content scripts run in an
// isolated world and can't see `window.monaco` or patch the page's fetch — this can.
// It watches the submission-check network response for an "Accepted" verdict, reads the
// FULL submitted code from the Monaco editor (no truncation), and postMessages it to the
// isolated content script (leetcode.ts), which enriches + forwards to the background worker.
(() => {
  const TAG = 'codevault-lc';

  // Read the full solution code from Monaco (the model with the most content).
  function readMonacoCode(): string | null {
    try {
      const w = window as unknown as {
        monaco?: { editor?: { getModels?: () => Array<{ getValue?: () => string }> } };
      };
      const models = w.monaco?.editor?.getModels?.();
      if (!models || !models.length) return null;
      let best = '';
      for (const m of models) {
        const v = m.getValue?.() ?? '';
        if (v.length > best.length) best = v;
      }
      return best.trim() || null;
    } catch {
      return null;
    }
  }

  function emitAccepted(lang?: string, questionId?: string): void {
    const code = readMonacoCode();
    window.postMessage({ __codevault: TAG, accepted: true, code, lang, questionId }, '*');
  }

  // Inspect a submission-check response body for an Accepted verdict.
  function inspect(url: string, body: string): void {
    if (!/\/submissions\/detail\/\d+\/check\/?/.test(url)) return;
    try {
      const data = JSON.parse(body);
      const accepted = data?.status_msg === 'Accepted' || data?.status_code === 10;
      if (accepted && (data?.state === 'SUCCESS' || data?.run_success)) {
        emitAccepted(String(data?.lang ?? data?.pretty_lang ?? ''), String(data?.question_id ?? ''));
      }
    } catch {
      /* not JSON — ignore */
    }
  }

  // Patch fetch (LeetCode polls the check endpoint via fetch).
  const origFetch = window.fetch;
  window.fetch = function (...args: Parameters<typeof fetch>) {
    const p = origFetch.apply(this, args);
    try {
      const first = args[0] as unknown;
      const url = typeof first === 'string' ? first : (first as Request)?.url;
      if (url && /\/check\/?$/.test(url)) {
        p.then((res) => res.clone().text().then((t) => inspect(url, t)).catch(() => {})).catch(() => {});
      }
    } catch {
      /* ignore */
    }
    return p;
  };

  // Patch XHR as a fallback (older submission path).
  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...a: unknown[]) {
    (this as unknown as { __cvUrl?: string }).__cvUrl = String(a[1] ?? '');
    // @ts-expect-error passthrough
    return origOpen.apply(this, a);
  };
  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, ...a: unknown[]) {
    this.addEventListener('load', () => {
      try {
        const url = (this as unknown as { __cvUrl?: string }).__cvUrl || '';
        if (/\/check\/?$/.test(url)) inspect(url, this.responseText);
      } catch {
        /* ignore */
      }
    });
    // @ts-expect-error passthrough
    return origSend.apply(this, a);
  };
})();
