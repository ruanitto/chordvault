const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseId,
  isValidDate,
  validateUserCredentials,
  validateSongInput,
  validateVisibility,
  validateSetlistInput,
  validateTranspose,
  validateLanguage,
  validatePreferredLanguages,
  parsePaginationParams,
} = require('../../lib/validation');

describe('parseId', () => {
  it('parses a valid integer string', () => {
    assert.equal(parseId('42'), 42);
  });

  it('returns null for non-numeric strings', () => {
    assert.equal(parseId('abc'), null);
  });

  it('returns null for undefined', () => {
    assert.equal(parseId(undefined), null);
  });

  it('parses "0" as 0', () => {
    assert.equal(parseId('0'), 0);
  });

  it('parses negative numbers', () => {
    assert.equal(parseId('-5'), -5);
  });
});

describe('isValidDate', () => {
  it('accepts YYYY-MM-DD format', () => {
    assert.equal(isValidDate('2024-06-15'), true);
  });

  it('rejects invalid format', () => {
    assert.equal(isValidDate('06/15/2024'), false);
  });

  it('rejects invalid date values', () => {
    assert.equal(isValidDate('2024-13-01'), false);
  });

  it('rejects empty string', () => {
    assert.equal(isValidDate(''), false);
  });
});

describe('validateUserCredentials', () => {
  it('returns null for valid credentials', () => {
    assert.equal(validateUserCredentials('alice', 'password123'), null);
  });

  it('rejects missing username', () => {
    assert.ok(validateUserCredentials('', 'password123'));
  });

  it('rejects missing password', () => {
    assert.ok(validateUserCredentials('alice', ''));
  });

  it('rejects short username', () => {
    assert.ok(validateUserCredentials('ab', 'password123'));
  });

  it('rejects short password', () => {
    assert.ok(validateUserCredentials('alice', '12345'));
  });

  it('rejects null username', () => {
    assert.ok(validateUserCredentials(null, 'password123'));
  });
});

describe('validateSongInput', () => {
  it('returns null for valid input', () => {
    assert.equal(validateSongInput({ title: 'Song', content: '[C]lyrics' }), null);
  });

  it('rejects missing title when required', () => {
    assert.ok(validateSongInput({ title: '', content: 'x', requireTitle: true }));
  });

  it('rejects missing content when required', () => {
    assert.ok(validateSongInput({ title: 'X', content: '', requireContent: true }));
  });

  it('rejects content without chords when requireChord is true', () => {
    assert.ok(validateSongInput({ title: 'X', content: 'no chords', requireChord: true }));
  });

  it('accepts content with chords when requireChord is true', () => {
    assert.equal(validateSongInput({ title: 'X', content: 'Hello [C] world', requireChord: true }), null);
  });

  it('rejects invalid youtube URL', () => {
    assert.ok(validateSongInput({ youtube_url: 'https://vimeo.com/123' }));
  });

  it('accepts valid youtube URL', () => {
    assert.equal(validateSongInput({ youtube_url: 'https://www.youtube.com/watch?v=abc' }), null);
  });

  it('accepts youtu.be short URL', () => {
    assert.equal(validateSongInput({ youtube_url: 'https://youtu.be/abc123' }), null);
  });

  it('rejects BPM out of range', () => {
    assert.ok(validateSongInput({ bpm: 0 }));
    assert.ok(validateSongInput({ bpm: 999 }));
  });

  it('accepts valid BPM', () => {
    assert.equal(validateSongInput({ bpm: 120 }), null);
  });

  it('rejects excessively long title', () => {
    assert.ok(validateSongInput({ title: 'a'.repeat(201) }));
  });
});

describe('validateVisibility', () => {
  it('returns null for public', () => {
    assert.equal(validateVisibility('public'), null);
  });

  it('returns null for private', () => {
    assert.equal(validateVisibility('private'), null);
  });

  it('returns null for undefined', () => {
    assert.equal(validateVisibility(undefined), null);
  });

  it('rejects invalid values', () => {
    assert.ok(validateVisibility('hidden'));
  });
});

describe('validateSetlistInput', () => {
  it('returns null for valid name', () => {
    assert.equal(validateSetlistInput('Sunday Set', null), null);
  });

  it('rejects empty name', () => {
    assert.ok(validateSetlistInput('', null));
  });

  it('rejects excessively long name', () => {
    assert.ok(validateSetlistInput('x'.repeat(201), null));
  });

  it('accepts valid event_date', () => {
    assert.equal(validateSetlistInput('Set', '2024-01-15'), null);
  });

  it('rejects invalid event_date', () => {
    assert.ok(validateSetlistInput('Set', 'not-a-date'));
  });
});

describe('validateTranspose', () => {
  it('returns null for undefined', () => {
    assert.equal(validateTranspose(undefined), null);
  });

  it('returns null for 0', () => {
    assert.equal(validateTranspose(0), null);
  });

  it('returns null for valid positive value', () => {
    assert.equal(validateTranspose(5), null);
  });

  it('returns null for valid negative value', () => {
    assert.equal(validateTranspose(-12), null);
  });

  it('rejects values below -12', () => {
    assert.ok(validateTranspose(-13));
  });

  it('rejects values above 12', () => {
    assert.ok(validateTranspose(13));
  });
});

describe('validateLanguage', () => {
  it('returns null for valid code', () => {
    assert.equal(validateLanguage('en'), null);
  });

  it('rejects empty string', () => {
    assert.ok(validateLanguage(''));
  });

  it('rejects null', () => {
    assert.ok(validateLanguage(null));
  });

  it('rejects invalid code', () => {
    assert.ok(validateLanguage('xx'));
  });
});

describe('validatePreferredLanguages', () => {
  it('returns null for valid array', () => {
    assert.equal(validatePreferredLanguages(['en', 'es']), null);
  });

  it('rejects non-array', () => {
    assert.ok(validatePreferredLanguages('en'));
  });

  it('rejects invalid codes in array', () => {
    assert.ok(validatePreferredLanguages(['en', 'xx']));
  });

  it('rejects too many languages', () => {
    const codes = Array(11).fill('en');
    assert.ok(validatePreferredLanguages(codes));
  });

  it('returns null for empty array', () => {
    assert.equal(validatePreferredLanguages([]), null);
  });
});

describe('parsePaginationParams', () => {
  it('returns nulls for both undefined', () => {
    const result = parsePaginationParams(undefined, undefined);
    assert.equal(result.page, null);
    assert.equal(result.limit, null);
  });

  it('parses valid page and limit', () => {
    const result = parsePaginationParams('2', '10');
    assert.equal(result.page, 2);
    assert.equal(result.limit, 10);
  });

  it('clamps page to minimum of 1', () => {
    const result = parsePaginationParams('0', '10');
    assert.equal(result.page, 1);
  });

  it('defaults limit to 20 when 0 is passed (falsy parseInt)', () => {
    const result = parsePaginationParams('1', '0');
    assert.equal(result.limit, 20);
  });

  it('defaults to page 1 and limit 20 for NaN values', () => {
    const result = parsePaginationParams('abc', 'xyz');
    assert.equal(result.page, 1);
    assert.equal(result.limit, 20);
  });
});
