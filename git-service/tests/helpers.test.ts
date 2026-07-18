import { describe, it, expect } from 'vitest';
import { padNumber, slugify, langToExt } from '../src/utils/helpers';

describe('padNumber', () => {
  it('left-pads to the requested width', () => {
    expect(padNumber('7')).toBe('0007');
    expect(padNumber('42', 4)).toBe('0042');
  });
  it('leaves numbers already at/over the width untouched', () => {
    expect(padNumber('1234')).toBe('1234');
    expect(padNumber('12345')).toBe('12345');
  });
  it('trims surrounding whitespace', () => {
    expect(padNumber('  9  ')).toBe('0009');
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates non-alphanumerics', () => {
    expect(slugify('Two Sum')).toBe('two-sum');
    expect(slugify('Longest Substring (No Repeat)')).toBe('longest-substring-no-repeat');
  });
  it('collapses runs and trims leading/trailing hyphens', () => {
    expect(slugify('  --Hello,   World!--  ')).toBe('hello-world');
  });
});

describe('langToExt', () => {
  it('maps known languages to file extensions', () => {
    expect(langToExt('Python3')).toBe('py');
    expect(langToExt('C++')).toBe('cpp');
    expect(langToExt('JavaScript')).toBe('js');
    expect(langToExt('Go')).toBe('go');
    expect(langToExt('MySQL')).toBe('sql');
  });
  it('falls back to txt for unknown or missing languages', () => {
    expect(langToExt('brainfuck')).toBe('txt');
    expect(langToExt(null)).toBe('txt');
    expect(langToExt(undefined)).toBe('txt');
  });
});
