import { ApiError, apiRequest } from './client';

const UNAUTHORIZED = 401;

/** true for a valid PIN, false for a wrong one; rethrows network/server failures. */
export async function verifyPin(pin: string): Promise<boolean> {
  try {
    await apiRequest('/api/auth/verify', { method: 'POST', body: { pin } });
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === UNAUTHORIZED) return false;
    throw error;
  }
}
