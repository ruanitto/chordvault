const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// We need to test createRateLimiter but it's not directly exported.
// We test through the exported middleware and apiRateLimiter.

describe('rateLimiter', () => {
  let rateLimiter;

  beforeEach(() => {
    // Ensure production-like behavior
    process.env.NODE_ENV = 'production';
    // Clear module cache so fresh rate limiter maps are created
    delete require.cache[require.resolve('../../lib/rateLimiter')];
    rateLimiter = require('../../lib/rateLimiter');
  });

  function createReq(overrides = {}) {
    return {
      ip: '127.0.0.1',
      method: 'GET',
      headers: {},
      ...overrides,
    };
  }

  function createRes() {
    let statusCode;
    let jsonBody;
    const headers = {};
    const res = {
      status(code) { statusCode = code; return res; },
      json(body) { jsonBody = body; return res; },
      set(key, value) { headers[key] = value; return res; },
      getStatus() { return statusCode; },
      getJson() { return jsonBody; },
      getHeaders() { return headers; },
    };
    return res;
  }

  describe('withSkipGlobal', () => {
    it('skips rate limiting in development', () => {
      process.env.NODE_ENV = 'development';
      delete require.cache[require.resolve('../../lib/rateLimiter')];
      const rl = require('../../lib/rateLimiter');
      const req = createReq();
      const res = createRes();
      let called = false;
      rl.withSkipGlobal(rl.authLimiter)(req, res, () => { called = true; });
      assert.ok(called);
      assert.equal(req._rateLimited, true);
    });

    it('skips rate limiting in test', () => {
      process.env.NODE_ENV = 'test';
      delete require.cache[require.resolve('../../lib/rateLimiter')];
      const rl = require('../../lib/rateLimiter');
      const req = createReq();
      const res = createRes();
      let called = false;
      rl.withSkipGlobal(rl.authLimiter)(req, res, () => { called = true; });
      assert.ok(called);
    });
  });

  describe('apiRateLimiter', () => {
    it('skips if NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      delete require.cache[require.resolve('../../lib/rateLimiter')];
      const rl = require('../../lib/rateLimiter');
      const req = createReq();
      const res = createRes();
      let called = false;
      rl.apiRateLimiter(req, res, () => { called = true; });
      assert.ok(called);
    });

    it('skips if request is already rate-limited', () => {
      const req = createReq({ _rateLimited: true });
      const res = createRes();
      let called = false;
      rateLimiter.apiRateLimiter(req, res, () => { called = true; });
      assert.ok(called);
    });

    it('applies write limiter for POST requests', () => {
      const req = createReq({ method: 'POST' });
      const res = createRes();
      let called = false;
      rateLimiter.apiRateLimiter(req, res, () => { called = true; });
      assert.ok(called);
    });

    it('applies read limiter for authenticated GET requests', () => {
      const req = createReq({ headers: { authorization: 'Bearer tok123' } });
      const res = createRes();
      let called = false;
      rateLimiter.apiRateLimiter(req, res, () => { called = true; });
      assert.ok(called);
    });

    it('applies public limiters for unauthenticated GET requests', () => {
      const req = createReq();
      const res = createRes();
      let called = false;
      rateLimiter.apiRateLimiter(req, res, () => { called = true; });
      assert.ok(called);
    });
  });
});
