import { describe, it, expect } from 'vitest';
import { LANGUAGES, LANGUAGE_CODES, languageName } from '../languages';

describe('languages', () => {
  it('LANGUAGES array is non-empty', () => {
    expect(LANGUAGES.length).toBeGreaterThan(0);
  });

  it('every language has a non-empty code and name', () => {
    for (const lang of LANGUAGES) {
      expect(lang.code).toBeTruthy();
      expect(lang.name).toBeTruthy();
    }
  });

  it('LANGUAGE_CODES contains all codes from LANGUAGES', () => {
    for (const lang of LANGUAGES) {
      expect(LANGUAGE_CODES.has(lang.code)).toBe(true);
    }
  });

  it('LANGUAGE_CODES has the same size as LANGUAGES (no duplicates)', () => {
    expect(LANGUAGE_CODES.size).toBe(LANGUAGES.length);
  });

  describe('languageName', () => {
    it('returns English for "en"', () => {
      expect(languageName('en')).toBe('English');
    });

    it('returns Chinese for "zh"', () => {
      expect(languageName('zh')).toBe('Chinese');
    });

    it('returns uppercased code for unknown codes', () => {
      expect(languageName('xx')).toBe('XX');
    });

    it('returns uppercased code for empty string', () => {
      expect(languageName('')).toBe('');
    });
  });
});
