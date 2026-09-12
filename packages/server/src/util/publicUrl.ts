const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/** Returns a normalized absolute URL without a trailing slash, null for blank input; throws on garbage. */
export function normalizePublicUrl(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '') return null;
  const url = new URL(trimmed);
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }
  return url.toString().replace(/\/$/u, '');
}
