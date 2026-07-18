import { describe, it, expect } from 'vitest';
import { problemFolder, questionPath, solutionPath } from '../src/services/repo.service';
import type { SolutionToSync } from '../src/types/sync.types';

const base: SolutionToSync = {
  platform: 'leetcode',
  number: '7',
  slug: 'reverse-integer',
  title: 'Reverse Integer',
  difficulty: 'medium',
  topics: ['Math', 'Dynamic Programming'],
  language: 'python3',
  code: 'print(1)',
  questionMarkdown: '',
};

describe('problemFolder', () => {
  it('defaults to a zero-padded number', () => {
    expect(problemFolder(base)).toBe('0007');
    expect(problemFolder(base, 'number')).toBe('0007');
  });

  it('difficulty convention prefixes the difficulty', () => {
    expect(problemFolder(base, 'difficulty')).toBe('medium/0007');
    expect(problemFolder({ ...base, difficulty: undefined }, 'difficulty')).toBe('unknown/0007');
  });

  it('topic convention slugifies the first topic', () => {
    expect(problemFolder(base, 'topic')).toBe('math/0007');
    expect(problemFolder({ ...base, topics: [] }, 'topic')).toBe('misc/0007');
  });
});

describe('questionPath / solutionPath', () => {
  it('append question.md under the folder', () => {
    expect(questionPath(base)).toBe('0007/question.md');
    expect(questionPath(base, 'difficulty')).toBe('medium/0007/question.md');
  });

  it('use the language extension for the solution file', () => {
    expect(solutionPath(base)).toBe('0007/solution.py');
    expect(solutionPath({ ...base, language: 'cpp' })).toBe('0007/solution.cpp');
    expect(solutionPath({ ...base, language: 'brainfuck' })).toBe('0007/solution.txt');
  });
});
