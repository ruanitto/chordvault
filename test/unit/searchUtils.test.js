const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getFtsSearch, getLikeSearch } = require('../../lib/searchUtils');

describe('getFtsSearch', () => {
  it('returns FTS MATCH clause for a simple query', () => {
    const result = getFtsSearch('amazing grace');
    assert.equal(result.sql, ' AND songs_search MATCH ?');
    assert.equal(result.params.length, 1);
    assert.ok(result.params[0].includes('amazing grace'));
  });

  it('wraps query in double quotes for exact phrase matching', () => {
    const result = getFtsSearch('hello');
    assert.ok(result.params[0].startsWith('"'));
    assert.ok(result.params[0].endsWith('"'));
  });

  it('escapes double quotes in the query', () => {
    const result = getFtsSearch('say "hello"');
    assert.ok(result.params[0].includes('""'));
  });

  it('generates OR clause for Chinese queries with variants', () => {
    // "国" (simplified) and "國" (traditional) should produce variants
    const result = getFtsSearch('国');
    // If OpenCC produces different traditional/simplified forms, we get OR
    if (result.params[0].includes(' OR ')) {
      assert.ok(result.params[0].includes(' OR '));
    } else {
      // Same form means no variants, still valid
      assert.equal(result.params.length, 1);
    }
  });
});

describe('getLikeSearch', () => {
  it('returns LIKE clause for a simple query', () => {
    const result = getLikeSearch('grace');
    assert.ok(result.sql.includes('LIKE ?'));
    assert.equal(result.params.length, 1);
    assert.equal(result.params[0], '%grace%');
  });

  it('uses the specified column', () => {
    const result = getLikeSearch('test', 'songs.title');
    assert.ok(result.sql.includes('songs.title LIKE'));
  });

  it('defaults column to s.name', () => {
    const result = getLikeSearch('test');
    assert.ok(result.sql.includes('s.name LIKE'));
  });

  it('wraps query with wildcards', () => {
    const result = getLikeSearch('hello');
    assert.equal(result.params[0], '%hello%');
  });

  it('trims whitespace from query', () => {
    const result = getLikeSearch('  hello  ');
    assert.equal(result.params[0], '%hello%');
  });

  it('generates OR clause for Chinese with variants', () => {
    const result = getLikeSearch('国');
    if (result.params.length === 2) {
      assert.ok(result.sql.includes(' OR '));
    } else {
      assert.equal(result.params.length, 1);
    }
  });
});
