import { describe, it, expect } from 'vitest';
import { capturedSubmissionSchema, ingestSchema } from '../src/validators/ingest.validator';

const goodCapture = {
  platform: 'leetcode',
  number: '1',
  slug: 'two-sum',
  title: 'Two Sum',
  difficulty: 'easy',
  language: 'python3',
  code: 'print(1)',
  questionMarkdown: '# Two Sum',
};

describe('capturedSubmissionSchema', () => {
  it('accepts a well-formed capture and applies defaults', () => {
    const parsed = capturedSubmissionSchema.parse(goodCapture);
    expect(parsed.topics).toEqual([]); // default
    expect(parsed.questionMarkdown).toBe('# Two Sum');
  });

  it('rejects an unknown platform', () => {
    expect(() => capturedSubmissionSchema.parse({ ...goodCapture, platform: 'spoj' })).toThrow();
  });

  it('rejects empty code and enforces the size cap', () => {
    expect(() => capturedSubmissionSchema.parse({ ...goodCapture, code: '' })).toThrow();
    expect(() =>
      capturedSubmissionSchema.parse({ ...goodCapture, code: 'x'.repeat(200_001) }),
    ).toThrow();
  });

  it('accepts code right at the size cap', () => {
    expect(() =>
      capturedSubmissionSchema.parse({ ...goodCapture, code: 'x'.repeat(200_000) }),
    ).not.toThrow();
  });

  it('rejects an invalid difficulty', () => {
    expect(() => capturedSubmissionSchema.parse({ ...goodCapture, difficulty: 'insane' })).toThrow();
  });
});

describe('ingestSchema', () => {
  it('requires at least one capture', () => {
    expect(() => ingestSchema.parse({ captures: [] })).toThrow();
  });

  it('caps the batch at 50 captures', () => {
    const many = Array.from({ length: 51 }, () => goodCapture);
    expect(() => ingestSchema.parse({ captures: many })).toThrow();
  });

  it('accepts a valid batch with an optional idempotency key', () => {
    const parsed = ingestSchema.parse({ captures: [goodCapture], idempotencyKey: 'abc-123' });
    expect(parsed.captures).toHaveLength(1);
    expect(parsed.idempotencyKey).toBe('abc-123');
  });
});
