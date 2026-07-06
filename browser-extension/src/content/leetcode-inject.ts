// Runs in the PAGE (MAIN) world on LeetCode problem pages. Its only privileged job is to
// read the FULL solution code from Monaco (`window.monaco`) — the isolated content script
// can't see that global. It also opportunistically catches the submission-check response to
// learn the language + confirm Accepted. Talks to the isolated content script via postMessage.
(() => {
  console.info('[CodeVault] MAIN hook active');

  // Read the full solution code + the editor's own language id from Monaco.
  function readMonaco(): { code: string | null; lang?: string } {
    try {
      const w = window as unknown as {
        monaco?: {
          editor?: {
            getModels?: () => Array<{ getValue?: () => string; getLanguageId?: () => string }>;
          };
        };
      };
      const models = w.monaco?.editor?.getModels?.() ?? [];
      let code = '';
      let lang: string | undefined;
      for (const m of models) {
        const v = m.getValue?.() ?? '';
        if (v.length > code.length) {
          code = v;
          lang = m.getLanguageId?.();
        }
      }
      return { code: code.trim() || null, lang };
    } catch {
      return { code: null };
    }
  }

  // Reply to code requests from the isolated content script.
  window.addEventListener('message', (ev: MessageEvent) => {
    const d = ev.data as { __cv?: string };
    if (ev.source !== window || d?.__cv !== 'get-code') return;
    const { code, lang } = readMonaco();
    window.postMessage({ __cv: 'code', code, lang }, '*');
  });

  // Bonus: sniff the submission-check response for language + Accepted confirmation.
  function inspect(url: string, body: string): void {
    if (!/\/submissions\/detail\/\d+\/check/.test(url)) return;
    try {
      const data = JSON.parse(body);
      const accepted = data?.status_msg === 'Accepted' || data?.status_code === 10;
      if (accepted) {
        window.postMessage(
          { __cv: 'accepted', lang: String(data?.lang ?? data?.pretty_lang ?? ''), questionId: String(data?.question_id ?? '') },
          '*',
        );
      }
    } catch {
      /* ignore */
    }
  }

  const origFetch = window.fetch;
  window.fetch = function (...args: Parameters<typeof fetch>) {
    const p = origFetch.apply(this, args);
    try {
      const first = args[0] as unknown;
      const url = typeof first === 'string' ? first : (first as Request)?.url;
      if (url && /\/check/.test(url)) {
        p.then((r) => r.clone().text().then((t) => inspect(url, t)).catch(() => {})).catch(() => {});
      }
    } catch {
      /* ignore */
    }
    return p;
  };

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
        const u = (this as unknown as { __cvUrl?: string }).__cvUrl || '';
        if (/\/check/.test(u)) inspect(u, this.responseText);
      } catch {
        /* ignore */
      }
    });
    // @ts-expect-error passthrough
    return origSend.apply(this, a);
  };
})();
