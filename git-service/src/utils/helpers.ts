import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Wrap an async route handler so thrown errors reach the error middleware.
// (Express 5 forwards async rejections automatically, but this keeps intent explicit
//  and works uniformly across handlers.)
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Zero-pad a problem number so folders sort naturally (e.g. "369" -> "0369").
export function padNumber(num: string, width = 4): string {
  const digits = String(num).trim();
  return digits.length >= width ? digits : digits.padStart(width, '0');
}

// Make a filesystem/URL-safe slug from a title.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Map a platform language name to a source-file extension.
const LANG_EXT: Record<string, string> = {
  python: 'py',
  python3: 'py',
  cpp: 'cpp',
  'c++': 'cpp',
  c: 'c',
  java: 'java',
  javascript: 'js',
  typescript: 'ts',
  csharp: 'cs',
  'c#': 'cs',
  go: 'go',
  golang: 'go',
  ruby: 'rb',
  swift: 'swift',
  kotlin: 'kt',
  rust: 'rs',
  scala: 'scala',
  php: 'php',
  sql: 'sql',
  mysql: 'sql',
};

export function langToExt(language?: string | null): string {
  if (!language) return 'txt';
  return LANG_EXT[language.toLowerCase()] ?? 'txt';
}
