import type { Cue, CueName, Phase, StateEnvelope, TeamId } from '../game/types';
import type { GameAction } from '../game/actions';

export const SOCKET_PATH = '/socket.io';
export const SURVEY_PATH = '/survey';
export const BUZZER_PATH = '/buzzer';

export type SocketRole = 'display' | 'host' | 'buzzer';

export type DisplayAuth = Readonly<{ role: 'display' }>;
export type HostAuth = Readonly<{ role: 'host'; pin: string }>;
export type BuzzerAuth = Readonly<{ role: 'buzzer'; team: TeamId; code: string }>;
export type SocketAuth = DisplayAuth | HostAuth | BuzzerAuth;

/** Set on the server socket after a successful handshake. */
export type SocketIdentity = Readonly<{ role: 'display' } | { role: 'host' } | { role: 'buzzer'; team: TeamId }>;

export type MetaPayload = Readonly<{
  publicUrl: string | null;
  lanUrl: string;
  surveyPath: string;
  buzzerPath: string;
}>;

/** Tiny payload for phones on flaky data. */
export type BuzzerStatePayload = Readonly<{
  seq: number;
  phase: Phase;
  buzzersOpen: boolean;
  lockedTeam: TeamId | null;
  yourTeam: TeamId;
  teamName: string;
}>;

export type HostActionPayload = Readonly<{ action: GameAction }>;
export type HostCuePayload = Readonly<{ name: CueName }>;
export type HostActionAck = Readonly<{ ok: true; seq: number; changed: boolean } | { ok: false; error: string }>;

export type ServerToClientEvents = {
  state: (envelope: StateEnvelope) => void;
  buzzer_state: (payload: BuzzerStatePayload) => void;
  cue: (cue: Cue) => void;
  meta: (meta: MetaPayload) => void;
};

export type ClientToServerEvents = {
  'host:action': (payload: HostActionPayload, ack: (result: HostActionAck) => void) => void;
  'host:cue': (payload: HostCuePayload) => void;
  'buzzer:buzz': () => void;
};

export const SOCKET_ERRORS = {
  badAuth: 'bad_auth',
  unauthorized: 'unauthorized',
  badCode: 'bad_code',
} as const;
