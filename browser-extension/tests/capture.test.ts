import { describe, it, expect } from 'vitest';
import { htmlToMarkdown, once, text } from '../src/lib/capture';

describe('htmlToMarkdown', () => {
  it('drops <style>/<script> blocks (no CSS/JS leaks into question.md)', () => {
    const md = htmlToMarkdown('<style>.x{color:red}</style><p>Hello</p><script>alert(1)</script>');
    expect(md).toBe('Hello');
    expect(md).not.toContain('color');
    expect(md).not.toContain('alert');
  });

  it('converts bold/italic and code blocks', () => {
    expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**');
    expect(htmlToMarkdown('<em>x</em>')).toBe('_x_');
    expect(htmlToMarkdown('<pre>code()</pre>')).toContain('```');
  });

  it('turns list items into markdown bullets', () => {
    const md = htmlToMarkdown('<ul><li>one</li><li>two</li></ul>');
    expect(md).toContain('- one');
    expect(md).toContain('- two');
  });

  it('decodes HTML entities and collapses blank lines', () => {
    expect(htmlToMarkdown('a &lt;b&gt; &amp; &quot;c&quot;')).toBe('a <b> & "c"');
    expect(htmlToMarkdown('<p>a</p><p></p><p>b</p>')).toBe('a\n\nb');
  });

  it('strips remaining tags and trims', () => {
    expect(htmlToMarkdown('  <span>hi</span>  ')).toBe('hi');
  });
});

describe('once (one-shot capture guard)', () => {
  it('returns true the first time and false thereafter for the same key', () => {
    const key = `k-${Math.random()}`;
    expect(once(key)).toBe(true);
    expect(once(key)).toBe(false);
    expect(once(key)).toBe(false);
  });

  it('treats different keys independently', () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(once(a)).toBe(true);
    expect(once(b)).toBe(true);
  });
});

describe('text', () => {
  it('returns trimmed textContent, or empty for null/undefined', () => {
    expect(text({ textContent: '  hi  ' } as any)).toBe('hi');
    expect(text(null)).toBe('');
    expect(text(undefined)).toBe('');
    expect(text({ textContent: null } as any)).toBe('');
  });
});
