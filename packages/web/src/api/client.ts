import { HOST_PIN_HEADER, type ApiResponse } from '@feud/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues?: readonly unknown[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type RequestOptions = Readonly<{
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  pin?: string | null;
}>;

const NO_CONTENT = 204;

async function parseEnvelope<T>(response: Response): Promise<ApiResponse<T> | null> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return null;
  }
}

/** Fetches an API route and unwraps the `{ ok, data, error }` envelope, throwing ApiError on failure. */
export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers();
  if (options.body !== undefined) headers.set('content-type', 'application/json');
  if (options.pin) headers.set(HOST_PIN_HEADER, options.pin);

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  }).catch(() => {
    throw new ApiError(0, 'network', 'Could not reach the server');
  });

  if (response.status === NO_CONTENT) return undefined as T;
  const envelope = await parseEnvelope<T>(response);
  if (!envelope) throw new ApiError(response.status, 'http_error', `Server error (${response.status})`);
  if (!envelope.ok) throw new ApiError(response.status, envelope.error.code, envelope.error.message, envelope.error.issues);
  return envelope.data;
}

export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
