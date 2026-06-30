export type PlatformName = 'leetcode' | 'codeforces' | 'codechef' | 'hackerrank';
export type Difficulty = 'easy' | 'medium' | 'hard';

// Matches git-service POST /api/ingest -> CapturedSubmission (validators/ingest.validator.ts).
export interface CapturedSubmission {
  platform: PlatformName;
  number: string;
  slug: string;
  title: string;
  difficulty?: Difficulty;
  topics: string[];
  language: string;
  code: string;
  questionMarkdown: string;
  solvedAt?: string; // ISO
  url?: string;
}

// Message a content script sends to the background worker.
export interface CaptureMessage {
  type: 'capture';
  submission: CapturedSubmission;
}

export interface IngestResponse {
  ok: boolean;
  accepted?: number;
  pushed?: number;
  skipped?: number;
  error?: string;
}
