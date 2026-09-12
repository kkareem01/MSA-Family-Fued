import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './client';

function mockFetch(status: number, body: unknown | null) {
  const response = {
    status,
    ok: status < 400,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(body === null ? '' : JSON.stringify(body)),
  } as unknown as Response;
  const fetchMock = vi.fn(() => Promise.resolve(response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('apiRequest', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('unwraps the envelope and sends the PIN header and JSON body', async () => {
    const fetchMock = mockFetch(200, { ok: true, data: { id: 'q1' }, error: null });
    const data = await apiRequest<{ id: string }>('/api/questions', { method: 'POST', body: { prompt: 'x' }, pin: 'secret' });
    expect(data).toEqual({ id: 'q1' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/questions');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ prompt: 'x' }));
    expect(new Headers(init.headers).get('x-host-pin')).toBe('secret');
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
  });

  it('returns undefined for 204', async () => {
    mockFetch(204, null);
    await expect(apiRequest('/api/auth/verify', { method: 'POST', body: { pin: 'abcd' } })).resolves.toBeUndefined();
  });

  it('throws an ApiError carrying the code, status and issues', async () => {
    mockFetch(400, { ok: false, data: null, error: { code: 'validation', message: 'Invalid request', issues: [{ path: ['prompt'] }] } });
    const error = await apiRequest('/api/questions').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'validation', message: 'Invalid request' });
    expect((error as ApiError).issues).toHaveLength(1);
  });

  it('maps a non-envelope failure and network errors', async () => {
    mockFetch(502, null);
    await expect(apiRequest('/api/x')).rejects.toMatchObject({ status: 502, code: 'http_error' });
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('boom'))));
    await expect(apiRequest('/api/x')).rejects.toMatchObject({ status: 0, code: 'network' });
  });
});
