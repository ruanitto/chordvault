import { describe, it, expect } from 'vitest';
import { escHtml } from '../util';

describe('escHtml', () => {
  it('escapes ampersand', () => {
    expect(escHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escHtml('<div>')).toBe('&lt;div&gt;');
  });

  it('escapes greater-than', () => {
    expect(escHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes double quotes', () => {
    expect(escHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escHtml("it's")).toBe('it&#39;s');
  });

  it('escapes all special characters together', () => {
    expect(escHtml('<a href="x">O\'Brien & Co</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;O&#39;Brien &amp; Co&lt;/a&gt;'
    );
  });

  it('returns the same string when no special characters exist', () => {
    expect(escHtml('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(escHtml('')).toBe('');
  });
});
