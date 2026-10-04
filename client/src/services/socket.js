import { io } from 'socket.io-client';
import { STORAGE_KEYS } from './api';

// Derive the socket URL from VITE_API_URL by stripping the trailing /api,
// since Socket.io upgrades on the same host/port as the HTTP server, not
// under the /api path.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

// One shared socket for the whole app, created lazily and only while a
// token exists. autoConnect is off so AuthContext controls exactly when a
// connection is attempted (e.g. never while logged out).
export function createSocket() {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  return io(SOCKET_URL, {
    auth: { token },
    autoConnect: false,
    reconnectionAttempts: 5,
  });
}
