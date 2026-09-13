import { ROOM_HOST, TEAM_IDS, type PresencePayload, type SocketIdentity, type TeamId } from '@feud/shared';
import type { FeudServer } from './types';

const EMPTY: PresencePayload = {
  displays: 0,
  displaysWithSound: 0,
  hosts: 0,
  buzzers: Object.fromEntries(TEAM_IDS.map((team) => [team, 0])) as Record<TeamId, number>,
};

function count(presence: PresencePayload, identity: SocketIdentity): PresencePayload {
  switch (identity.role) {
    case 'display':
      return { ...presence, displays: presence.displays + 1, displaysWithSound: presence.displaysWithSound + (identity.audioUnlocked ? 1 : 0) };
    case 'host':
      return { ...presence, hosts: presence.hosts + 1 };
    default:
      return { ...presence, buzzers: { ...presence.buzzers, [identity.team]: presence.buzzers[identity.team] + 1 } };
  }
}

/** Counts every connected socket by role. Socket.IO removes a socket before firing `disconnect`, so this is always current. */
export function snapshotPresence(io: FeudServer): PresencePayload {
  return Array.from(io.sockets.sockets.values()).reduce((acc, socket) => count(acc, socket.data), EMPTY);
}

export function createPresence(io: FeudServer) {
  return {
    snapshot: () => snapshotPresence(io),
    /** Hosts get a fresh count; displays and buzzers never see it. */
    publish(): void {
      io.to(ROOM_HOST).emit('presence', snapshotPresence(io));
    },
  };
}

export type Presence = ReturnType<typeof createPresence>;
