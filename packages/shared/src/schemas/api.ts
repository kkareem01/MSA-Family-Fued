/** Every JSON endpoint answers with this envelope. */
export type ApiError = Readonly<{ code: string; message: string; issues?: readonly unknown[] }>;
export type ApiResponse<T> = Readonly<{ ok: true; data: T; error: null }> | Readonly<{ ok: false; data: null; error: ApiError }>;

export function apiOk<T>(data: T): ApiResponse<T> {
  return { ok: true, data, error: null };
}

export function apiFail(code: string, message: string, issues?: readonly unknown[]): ApiResponse<never> {
  return { ok: false, data: null, error: issues ? { code, message, issues } : { code, message } };
}
