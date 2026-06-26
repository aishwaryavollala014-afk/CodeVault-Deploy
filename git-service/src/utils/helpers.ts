import type { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Zero-pad a problem number for stable folder ordering (e.g. "369" -> "0369"). */
export function padNumber(num: string, width = 4): string {
  return /^\d+$/.test(num) ? num.padStart(width, '0') : num;
}

/** Slugify a title for safe folder/file names. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const LANG_EXT: Record<string, string> = {
  python: 'py',
  python3: 'py',
  'c++': 'cpp',
  cpp: 'cpp',
  'gnu c++': 'cpp',
  c: 'c',
  java: 'java',
  javascript: 'js',
  typescript: 'ts',
  go: 'go',
  golang: 'go',
  rust: 'rs',
  kotlin: 'kt',
  swift: 'swift',
  ruby: 'rb',
  scala: 'scala',
  'c#': 'cs',
  csharp: 'cs',
  php: 'php',
};

/** Map a platform language label to a source-file extension. */
export function langToExt(language?: string | null): string {
  if (!language) return 'txt';
  const key = language.toLowerCase().split('(')[0].trim();
  return LANG_EXT[key] ?? 'txt';
}
