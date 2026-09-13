const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//iu;
const LOOKS_LIKE_HOST = /^[a-z0-9.-]+(?::\d+)?(?:\/.*)?$/iu;

/** Hosting dashboards hand out bare domains; treat those as https so a paste-as-is works. */
function withScheme(value: string): string {
  if (HAS_SCHEME.test(value)) return value;
  if (LOOKS_LIKE_HOST.test(value)) return `https://${value}`;
  return value;
}

/** Returns a normalized absolute URL without a trailing slash, null for blank input; throws on garbage. */
export function normalizePublicUrl(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '') return null;
  const url = new URL(withScheme(trimmed));
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new Error(`Unsupported URL protocol: ${url.protocol}`);
  }
  return url.toString().replace(/\/$/u, '');
}
