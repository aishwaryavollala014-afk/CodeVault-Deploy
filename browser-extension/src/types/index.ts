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

// Messages content scripts / popup send to the background worker.
export interface CaptureMessage {
  type: 'capture';
  submission: CapturedSubmission;
}

export interface SetTokenMessage {
  type: 'setToken';
  token: string; // the user's CodeVault JWT, read from the web app
}

export interface SignOutMessage {
  type: 'signOut';
}

export interface GetStatusMessage {
  type: 'getStatus';
}

export interface GetRecentMessage {
  type: 'getRecent';
}

export type ExtMessage =
  | CaptureMessage
  | SetTokenMessage
  | SignOutMessage
  | GetStatusMessage
  | GetRecentMessage;

export interface RecentItem {
  platform: PlatformName;
  number: string;
  slug: string;
  title: string;
  solvedAt?: string;
}

export interface RecentResponse {
  ok: boolean;
  items?: RecentItem[];
  error?: string;
}

export interface IngestResponse {
  ok: boolean;
  accepted?: number;
  pushed?: number;
  skipped?: number;
  error?: string;
}

export interface AuthStatus {
  signedIn: boolean;
}
