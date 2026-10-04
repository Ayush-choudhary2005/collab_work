import { createContext, useEffect, useRef, useState } from 'react';
import { createSocket } from '../services/socket';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const { currentWorkspace } = useTenant();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  // Which tenant the socket has actually (successfully) joined — distinct
  // from currentWorkspace, which can change before the join ack returns.
  const [joinedTenantId, setJoinedTenantId] = useState(null);

  // Connection lifecycle follows the TOKEN only. Reconnecting on every
  // workspace switch would drop in-flight listeners for no reason — the
  // effect below handles switching rooms on an already-open connection.
  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      setJoinedTenantId(null);
      return undefined;
    }

    const socket = createSocket();
    socketRef.current = socket;
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => {
      setConnected(false);
      setJoinedTenantId(null); // server-side room membership is gone too
    });
    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Room membership follows the SELECTED WORKSPACE, on top of whatever
  // connection the effect above is managing.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected || !currentWorkspace) return undefined;

    let cancelled = false;
    socket.emit('workspace:join', currentWorkspace.id, (res) => {
      if (cancelled) return;
      setJoinedTenantId(res.ok ? currentWorkspace.id : null);
    });
    return () => {
      cancelled = true;
    };
  }, [connected, currentWorkspace]);

  const value = { socket: socketRef.current, connected, joinedTenantId };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
