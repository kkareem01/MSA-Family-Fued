import { CUE_NAMES, type ApiResponse, type CueName } from '@feud/shared';

export const SOUNDS_BASE = '/sounds';
const MANIFEST_URL = '/api/sounds';
const EXTENSION = 'mp3';

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const CUE_SET: ReadonlySet<string> = new Set(CUE_NAMES);

/** Asks the server which cue files exist so we never request missing ones. Empty on any failure. */
export async function fetchSoundManifest(fetchFn: FetchLike = fetch): Promise<readonly CueName[]> {
  try {
    const response = await fetchFn(MANIFEST_URL);
    if (!response.ok) return [];
    const body = (await response.json()) as ApiResponse<{ overrides: unknown }>;
    if (!body.ok || !Array.isArray(body.data.overrides)) return [];
    return body.data.overrides.filter((n): n is CueName => typeof n === 'string' && CUE_SET.has(n));
  } catch {
    return [];
  }
}

/** Downloads and decodes `/sounds/<name>.mp3`. Null on any failure. */
export async function loadOverride(ctx: AudioContext, name: CueName, fetchFn: FetchLike = fetch): Promise<AudioBuffer | null> {
  try {
    const response = await fetchFn(`${SOUNDS_BASE}/${name}.${EXTENSION}`);
    if (!response.ok) return null;
    return await ctx.decodeAudioData(await response.arrayBuffer());
  } catch {
    return null;
  }
}
