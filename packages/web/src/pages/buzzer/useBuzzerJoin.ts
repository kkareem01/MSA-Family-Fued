import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TEAM_IDS, type TeamId } from '@feud/shared';
import { STORAGE_KEYS } from '../../config';
import { readStorage, removeStorage, writeStorage } from '../../util/storage';

export type BuzzerJoin = Readonly<{ team: TeamId; code: string }>;

function isTeam(value: string | null): value is TeamId {
  return value !== null && (TEAM_IDS as readonly string[]).includes(value);
}

function parseStored(raw: string | null): BuzzerJoin | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { team?: string; code?: string };
    const team = parsed.team ?? null;
    return isTeam(team) && typeof parsed.code === 'string' ? { team, code: parsed.code } : null;
  } catch {
    return null;
  }
}

/** Team + code from the link (?team=A&code=XXXX), else from the last successful join, else the form. */
export function useBuzzerJoin() {
  const [params] = useSearchParams();
  const fromUrl = useMemo<BuzzerJoin | null>(() => {
    const team = params.get('team')?.toUpperCase() ?? null;
    const code = params.get('code')?.toUpperCase() ?? '';
    return isTeam(team) && code.length > 0 ? { team, code } : null;
  }, [params]);
  const [join, setJoin] = useState<BuzzerJoin | null>(() => fromUrl ?? parseStored(readStorage(STORAGE_KEYS.buzzerJoin)));

  const start = useCallback((next: BuzzerJoin) => {
    const clean = { team: next.team, code: next.code.trim().toUpperCase() };
    writeStorage(STORAGE_KEYS.buzzerJoin, JSON.stringify(clean));
    setJoin(clean);
  }, []);

  const leave = useCallback(() => {
    removeStorage(STORAGE_KEYS.buzzerJoin);
    setJoin(null);
  }, []);

  return { join, start, leave };
}
