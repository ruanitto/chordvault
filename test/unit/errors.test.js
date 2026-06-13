const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { AppError, handleDbError, errorHandler } = require('../../lib/errors');

describe('AppError', () => {
  it('creates an error with message and default status 500', () => {
    const err = new AppError('something broke');
    assert.equal(err.message, 'something broke');
    assert.equal(err.status, 500);
    assert.equal(err.code, undefined);
    assert.equal(err.name, 'AppError');
  });

  it('creates an error with custom status', () => {
    const err = new AppError('not found', 404);
    assert.equal(err.status, 404);
  });

  it('creates an error with code', () => {
    const err = new AppError('duplicate', 400, 'DUPLICATE');
    assert.equal(err.code, 'DUPLICATE');
  });

  it('is an instance of Error', () => {
    const err = new AppError('test');
    assert.ok(err instanceof Error);
  });
});

describe('handleDbError', () => {
  it('returns 400 for UNIQUE constraint errors', () => {
    const err = new Error('UNIQUE constraint failed: users.username');
    const result = handleDbError(err);
    assert.equal(result.status, 400);
    assert.equal(result.code, 'DUPLICATE');
  });

  it('uses custom uniqueMessage when provided', () => {
    const err = new Error('UNIQUE constraint failed');
    const result = handleDbError(err, { uniqueMessage: 'Username taken' });
    assert.equal(result.message, 'Username taken');
  });

  it('returns 500 for unknown database errors', () => {
    const err = new Error('disk I/O error');
    const result = handleDbError(err);
    assert.equal(result.status, 500);
    assert.equal(result.code, 'DB_ERROR');
    assert.equal(result.message, 'Server error');
  });

  it('returns an AppError instance', () => {
    const err = new Error('some db error');
    const result = handleDbError(err);
    assert.ok(result instanceof AppError);
  });
});

describe('errorHandler', () => {
  function createRes() {
    let statusCode;
    let jsonBody;
    const res = {
      status(code) {
        statusCode = code;
        return res;
      },
      json(body) {
        jsonBody = body;
        return res;
      },
      getStatus() { return statusCode; },
      getJson() { return jsonBody; },
    };
    return res;
  }

  it('handles AppError with status and message', () => {
    const err = new AppError('Forbidden', 403, 'NO_ACCESS');
    const res = createRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res.getStatus(), 403);
    assert.deepEqual(res.getJson(), { error: 'Forbidden', code: 'NO_ACCESS' });
  });

  it('handles AppError without code', () => {
    const err = new AppError('Bad request', 400);
    const res = createRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res.getStatus(), 400);
    assert.deepEqual(res.getJson(), { error: 'Bad request' });
  });

  it('handles generic errors as 500', () => {
    const err = new Error('unexpected');
    const res = createRes();
    errorHandler(err, {}, res, () => {});
    assert.equal(res.getStatus(), 500);
    assert.deepEqual(res.getJson(), { error: 'Internal server error' });
  });
});
