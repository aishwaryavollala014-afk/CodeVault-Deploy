import { describe, it, expect } from 'vitest';
import { buildQuestionMarkdown, toSolutionToSync } from '../src/services/problem.service';
import type { Question, Submission } from '../src/types/sync.types';

const question: Question = {
  slug: 'two-sum',
  number: '1',
  title: 'Two Sum',
  difficulty: 'easy',
  topics: ['Array', 'Hash Table'],
  statementMarkdown: 'Given an array of integers...',
  url: 'https://leetcode.com/problems/two-sum',
};

describe('buildQuestionMarkdown', () => {
  it('renders title, difficulty, topics, link, and statement', () => {
    const md = buildQuestionMarkdown(question);
    expect(md).toContain('# 1. Two Sum');
    expect(md).toContain('| **Difficulty** | easy |');
    expect(md).toContain('`Array` · `Hash Table`');
    expect(md).toContain('[https://leetcode.com/problems/two-sum](https://leetcode.com/problems/two-sum)');
    expect(md).toContain('Given an array of integers...');
  });

  it('falls back to "-" for missing difficulty / topics / url', () => {
    const md = buildQuestionMarkdown({
      ...question,
      difficulty: undefined,
      topics: [],
      url: undefined,
    });
    expect(md).toContain('| **Difficulty** | - |');
    expect(md).toContain('| **Topics** | - |');
    expect(md).toContain('| **Link** | - |');
  });

  it('uses a placeholder when the statement is empty', () => {
    const md = buildQuestionMarkdown({ ...question, statementMarkdown: '' });
    expect(md).toContain('_Statement not available._');
  });
});

describe('toSolutionToSync', () => {
  const baseSub: Submission = {
    platform: 'leetcode',
    number: '1',
    slug: 'two-sum',
    title: 'Two Sum',
    topics: [],
    language: 'python3',
    code: 'print(1)',
  };

  it('falls back to the question for difficulty, topics, and url when the submission omits them', () => {
    const item = toSolutionToSync(baseSub, question);
    expect(item.difficulty).toBe('easy'); // from question
    expect(item.topics).toEqual(['Array', 'Hash Table']); // from question
    expect(item.url).toBe(question.url); // from question
    expect(item.questionMarkdown).toContain('# 1. Two Sum');
    expect(item.code).toBe('print(1)');
  });

  it('prefers the submission values when present', () => {
    const item = toSolutionToSync(
      { ...baseSub, difficulty: 'hard', topics: ['Greedy'], url: 'https://x/y' },
      question,
    );
    expect(item.difficulty).toBe('hard');
    expect(item.topics).toEqual(['Greedy']);
    expect(item.url).toBe('https://x/y');
  });
});
