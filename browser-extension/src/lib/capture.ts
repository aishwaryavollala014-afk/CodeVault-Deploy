import type { CapturedSubmission, CaptureMessage, IngestResponse } from '../types';

// Send a captured submission to the background worker (which posts it to /api/ingest).
// Content scripts never hold the JWT — only the background does.
export function sendCapture(submission: CapturedSubmission): void {
  const msg: CaptureMessage = { type: 'capture', submission };
  chrome.runtime
    .sendMessage(msg)
    .then((res: IngestResponse | undefined) => {
      if (res?.ok) console.info('[CodeVault] synced', submission.slug, res);
      else console.warn('[CodeVault] capture not sent:', res?.error);
    })
    .catch((e) => console.warn('[CodeVault] capture message failed', e));
}

export function text(el: Element | null | undefined): string {
  return (el?.textContent ?? '').trim();
}

// One-shot guard: don't re-capture the same accepted submission on a page repeatedly.
const seen = new Set<string>();
export function once(key: string): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

// Read the Monaco editor's code if present (LeetCode/CodeChef use Monaco).
export function readMonaco(): string | null {
  const w = window as unknown as { monaco?: { editor?: { getModels?: () => Array<{ getValue(): string }> } } };
  const models = w.monaco?.editor?.getModels?.();
  if (models && models.length > 0) return models[0]!.getValue();
  return null;
}
