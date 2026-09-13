import {
  BUZZER_PATH,
  ROOM_DISPLAY,
  ROOM_HOST,
  SURVEY_PATH,
  TEAM_IDS,
  buzzerRoom,
  type BuzzerStatePayload,
  type MetaPayload,
  type StateEnvelope,
  type TeamId,
} from '@feud/shared';
import type { GameEvent, GameService } from '../services/gameService';
import type { SettingsService } from '../services/settingsService';
import type { FeudServer, FeudSocket } from './types';

export type BroadcasterDeps = Readonly<{ gameService: GameService; settingsService: SettingsService }>;

export function buzzerStateFor(team: TeamId, envelope: StateEnvelope): BuzzerStatePayload {
  const { state } = envelope;
  return {
    seq: envelope.seq,
    phase: state.phase,
    buzzersOpen: state.phase === 'faceoff' && state.round.faceoff.buzzersOpen,
    lockedTeam: state.round.faceoff.lockedTeam,
    yourTeam: team,
    teamName: state.teams[team].name,
  };
}

/** Fans game events out to rooms: full state to hosts, masked state to displays, tiny payloads to buzzers. */
export function createBroadcaster(io: FeudServer, { gameService, settingsService }: BroadcasterDeps) {
  const meta = (): MetaPayload => ({
    publicUrl: settingsService.getPublicUrl(),
    lanUrl: settingsService.getLanUrl(),
    surveyPath: SURVEY_PATH,
    buzzerPath: BUZZER_PATH,
    spotlight: settingsService.getSpotlight(),
  });

  return {
    meta,
    sendMetaToAll(): void {
      io.emit('meta', meta());
    },
    /** Initial payloads for a freshly connected socket, by role. */
    welcome(socket: FeudSocket): void {
      socket.emit('meta', meta());
      const identity = socket.data;
      if (identity.role === 'host') socket.emit('state', gameService.getEnvelope());
      if (identity.role === 'display') socket.emit('state', gameService.getPublicEnvelope());
      if (identity.role === 'buzzer') socket.emit('buzzer_state', buzzerStateFor(identity.team, gameService.getEnvelope()));
    },
    broadcast(event: GameEvent): void {
      io.to(ROOM_HOST).emit('state', event.envelope);
      io.to(ROOM_DISPLAY).emit('state', event.publicEnvelope);
      TEAM_IDS.forEach((team) => io.to(buzzerRoom(team)).emit('buzzer_state', buzzerStateFor(team, event.envelope)));
      event.cues.forEach((cue) => io.to(ROOM_DISPLAY).emit('cue', cue));
    },
  };
}

export type Broadcaster = ReturnType<typeof createBroadcaster>;
