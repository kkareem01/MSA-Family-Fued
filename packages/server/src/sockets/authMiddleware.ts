import { SOCKET_ERRORS, socketAuthSchema, type SocketAuth, type SocketIdentity } from '@feud/shared';
import type { Auth } from '../services/auth';
import type { SettingsService } from '../services/settingsService';
import type { FeudSocket } from './types';

export type AuthMiddlewareDeps = Readonly<{ auth: Auth; settingsService: SettingsService }>;

function identityFor(auth: SocketAuth): SocketIdentity {
  switch (auth.role) {
    case 'buzzer':
      return { role: 'buzzer', team: auth.team };
    case 'display':
      return { role: 'display', audioUnlocked: false };
    default:
      return { role: 'host' };
  }
}

/** Validates the handshake and stamps the socket with its role (and team for buzzers). */
export function createAuthMiddleware({ auth, settingsService }: AuthMiddlewareDeps) {
  return (socket: FeudSocket, next: (error?: Error) => void): void => {
    const parsed = socketAuthSchema.safeParse(socket.handshake.auth);
    if (!parsed.success) return next(new Error(SOCKET_ERRORS.badAuth));
    const identity = parsed.data;
    if (identity.role === 'host' && !auth.verifyPin(identity.pin)) return next(new Error(SOCKET_ERRORS.unauthorized));
    if (identity.role === 'buzzer' && !settingsService.verifyBuzzerCode(identity.team, identity.code)) {
      return next(new Error(SOCKET_ERRORS.badCode));
    }
    socket.data = identityFor(identity);
    return next();
  };
}
