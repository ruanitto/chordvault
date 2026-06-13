import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError } from '../api';

describe('api', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetch(status: number, body: unknown, ok?: boolean) {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: ok ?? (status >= 200 && status < 300),
      status,
      json: () => Promise.resolve(body),
    });
  }

  it('makes a GET request and returns parsed JSON', async () => {
    mockFetch(200, { id: 1, title: 'Song' });
    const data = await api<{ id: number; title: string }>('GET', '/api/songs/1');
    expect(data).toEqual({ id: 1, title: 'Song' });
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/songs/1', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: undefined,
    });
  });

  it('sends a JSON body for POST requests', async () => {
    mockFetch(200, { id: 2 });
    await api('POST', '/api/songs', { title: 'New' }, 'my-token');
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/songs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-token',
      },
      body: JSON.stringify({ title: 'New' }),
    });
  });

  it('adds Authorization header when token is provided', async () => {
    mockFetch(200, {});
    await api('GET', '/api/test', undefined, 'tok123');
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].headers.Authorization).toBe('Bearer tok123');
  });

  it('omits Authorization header when token is null', async () => {
    mockFetch(200, {});
    await api('GET', '/api/test', undefined, null);
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].headers.Authorization).toBeUndefined();
  });

  it('throws ApiError with message from response on non-ok', async () => {
    mockFetch(400, { error: 'Bad title' }, false);
    await expect(api('POST', '/api/songs', { title: '' })).rejects.toThrow(ApiError);
    try {
      await api('POST', '/api/songs', { title: '' });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).message).toBe('Bad title');
      expect((e as ApiError).status).toBe(400);
    }
  });

  it('throws ApiError when JSON parsing fails on non-ok response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });
    await expect(api('GET', '/api/fail')).rejects.toThrow('Server error (500)');
  });

  it('throws ApiError when JSON parsing fails on ok response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('parse error')),
    });
    await expect(api('GET', '/api/empty')).rejects.toThrow('Invalid response from server');
  });

  it('ApiError has correct name and status', () => {
    const err = new ApiError('test', 404);
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.message).toBe('test');
  });
});
