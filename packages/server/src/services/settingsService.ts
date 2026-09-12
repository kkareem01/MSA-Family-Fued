import { randomInt } from 'node:crypto';
import type { BuzzerCodes, PublicSettings, TeamId } from '@feud/shared';
import type { SettingsRepo } from '../repositories/settingsRepo';
import type { ServerConfig } from '../config';
import { normalizePublicUrl } from '../util/publicUrl';
import { lanIp } from '../util/lanIp';
import { badRequest } from './errors';

const KEY_PUBLIC_URL = 'public_url';
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
type UrlListener = (publicUrl: string | null) => void;

export function createSettingsService({ settings, config, now }: SettingsServiceDeps) {
  const listeners = new Set<UrlListener>();

  const getPublicUrl = (): string | null => settings.get(KEY_PUBLIC_URL) ?? config.publicUrl;

  const getBuzzerCodes = (): BuzzerCodes => {
    const stored = { A: settings.get(BUZZER_KEYS.A), B: settings.get(BUZZER_KEYS.B) };
    if (stored.A && stored.B && stored.A !== stored.B) return { A: stored.A, B: stored.B };
    const fresh = generateDistinctCodes();
    settings.set(BUZZER_KEYS.A, fresh.A, now());
    settings.set(BUZZER_KEYS.B, fresh.B, now());
    return fresh;
  };

  const getLanUrl = (): string => `http://${lanIp() ?? FALLBACK_HOST}:${config.port}`;

  const getPublicSettings = (): PublicSettings => ({ publicUrl: getPublicUrl(), lanUrl: getLanUrl(), buzzerCodes: getBuzzerCodes() });

  return {
    getPublicUrl,
    getLanUrl,
    getBuzzerCodes,
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
      const effective = getPublicUrl();
      listeners.forEach((listener) => listener(effective));
      return effective;
    },
    rotateBuzzerCodes(): BuzzerCodes {
      const fresh = generateDistinctCodes();
      settings.set(BUZZER_KEYS.A, fresh.A, now());
      settings.set(BUZZER_KEYS.B, fresh.B, now());
      return fresh;
    },
    verifyBuzzerCode: (team: TeamId, code: unknown): boolean =>
      typeof code === 'string' && code.toUpperCase() === getBuzzerCodes()[team],
    onPublicUrlChange(listener: UrlListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export type SettingsService = ReturnType<typeof createSettingsService>;
