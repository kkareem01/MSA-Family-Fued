import { randomInt } from 'node:crypto';
import { spotlightValueSchema, type BuzzerCodes, type PublicSettings, type Spotlight, type TeamId } from '@feud/shared';
import type { SettingsRepo } from '../repositories/settingsRepo';
import type { ServerConfig } from '../config';
import { normalizePublicUrl } from '../util/publicUrl';
import { lanIp } from '../util/lanIp';
import { badRequest } from './errors';

const KEY_PUBLIC_URL = 'public_url';
const KEY_SPOTLIGHT = 'spotlight';
const storedSpotlight = spotlightValueSchema.catch(null);
const BUZZER_KEYS: Readonly<Record<TeamId, string>> = { A: 'buzzer_code_A', B: 'buzzer_code_B' };
/** No I, O, 0 or 1 so codes read unambiguously on a projector. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;
const FALLBACK_HOST = '127.0.0.1';

function generateCode(): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
}

function generateDistinctCodes(): BuzzerCodes {
  const a = generateCode();
  const b = generateCode();
  return a === b ? generateDistinctCodes() : { A: a, B: b };
}

export type SettingsServiceDeps = Readonly<{ settings: SettingsRepo; config: ServerConfig; now: () => number }>;
type ChangeListener = () => void;

export function createSettingsService({ settings, config, now }: SettingsServiceDeps) {
  const listeners = new Set<ChangeListener>();
  const notifyChange = (): void => listeners.forEach((listener) => listener());

  const getPublicUrl = (): string | null => settings.get(KEY_PUBLIC_URL) ?? config.publicUrl;
  const getSpotlight = (): Spotlight => storedSpotlight.parse(settings.get(KEY_SPOTLIGHT));

  const getBuzzerCodes = (): BuzzerCodes => {
    const stored = { A: settings.get(BUZZER_KEYS.A), B: settings.get(BUZZER_KEYS.B) };
    if (stored.A && stored.B && stored.A !== stored.B) return { A: stored.A, B: stored.B };
    const fresh = generateDistinctCodes();
    settings.set(BUZZER_KEYS.A, fresh.A, now());
    settings.set(BUZZER_KEYS.B, fresh.B, now());
    return fresh;
  };

  const getLanUrl = (): string => `http://${lanIp() ?? FALLBACK_HOST}:${config.port}`;

  const getPublicSettings = (): PublicSettings => ({
    publicUrl: getPublicUrl(),
    lanUrl: getLanUrl(),
    buzzerCodes: getBuzzerCodes(),
    spotlight: getSpotlight(),
  });

  return {
    getPublicUrl,
    getLanUrl,
    getBuzzerCodes,
    getSpotlight,
    getPublicSettings,
    setPublicUrl(raw: string | null): string | null {
      const normalized = (() => {
        try {
          return normalizePublicUrl(raw);
        } catch {
          throw badRequest('That is not a valid http(s) URL');
        }
      })();
      if (normalized === null) settings.remove(KEY_PUBLIC_URL);
      else settings.set(KEY_PUBLIC_URL, normalized, now());
      notifyChange();
      return getPublicUrl();
    },
    /** Puts a full-screen takeover on (or off) the projector; every screen hears about it through meta. */
    setSpotlight(value: Spotlight): Spotlight {
      if (value === null) settings.remove(KEY_SPOTLIGHT);
      else settings.set(KEY_SPOTLIGHT, value, now());
      notifyChange();
      return getSpotlight();
    },
    rotateBuzzerCodes(): BuzzerCodes {
      const fresh = generateDistinctCodes();
      settings.set(BUZZER_KEYS.A, fresh.A, now());
      settings.set(BUZZER_KEYS.B, fresh.B, now());
      return fresh;
    },
    verifyBuzzerCode: (team: TeamId, code: unknown): boolean =>
      typeof code === 'string' && code.toUpperCase() === getBuzzerCodes()[team],
    /** Fires after the public URL or the spotlight changes. */
    onChange(listener: ChangeListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
