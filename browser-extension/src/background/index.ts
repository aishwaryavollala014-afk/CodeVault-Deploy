import type { CaptureMessage, IngestResponse } from '../types';
import { postIngest } from '../lib/api-client';

// MV3 service worker. The sole holder of the JWT — content scripts send capture
// messages here, and only this worker talks to git-service /api/ingest.
chrome.runtime.onMessage.addListener(
  (msg: CaptureMessage, sender, sendResponse: (res: IngestResponse) => void) => {
    if (msg?.type !== 'capture') return false;

    // Validate the message origin: must come from a content script on a real tab.
    if (!sender.tab || !sender.url) {
      sendResponse({ ok: false, error: 'invalid_sender' });
      return false;
    }

    postIngest([msg.submission])
      .then((res) => sendResponse(res))
      .catch((err) =>
        sendResponse({ ok: false, error: err instanceof Error ? err.message : 'unknown' }),
      );

    return true; // keep the message channel open for the async response
  },
);
