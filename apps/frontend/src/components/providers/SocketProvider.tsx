'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useHangoutStore } from '@/store/hangoutStore';
import { useNotificationStore } from '@/store/notificationStore';
import { SocketEvents } from '@memechat/shared';
import type { HangoutEvent, Notification } from '@memechat/shared';
import toast from 'react-hot-toast';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, data?: unknown) => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  emit: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated, user } = useAuthStore();
  const { addPendingInvite, updateActiveEvent, openIncomingHangout } = useHangoutStore();
  const { add: addNotification } = useNotificationStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';

    const socket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    // ── Hangout events ─────────────────────────────────────────
    socket.on(SocketEvents.HANGOUT_CREATED, (event: HangoutEvent) => {
      if (event.initiatorId !== user?.id) {
        addPendingInvite(event);
        addNotification({
          type: 'hangout_request',
          title: `${event.initiator?.displayName ?? 'Someone'} wants to hang out!`,
          body: `${event.type.replace('_', ' ')} 🎉`,
          avatar: event.initiator?.avatar,
          from: event.initiator?.displayName,
        });
        toast.custom(() => (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-neu-lg cursor-pointer"
            style={{
              background: 'var(--neu-bg-card)',
              boxShadow: '6px 6px 12px var(--neu-shadow-1), -6px -6px 12px var(--neu-shadow-2)',
            }}
            onClick={() => openIncomingHangout(event)}
          >
            <span className="text-2xl">
              {event.type === 'smoke_break' ? '🚬' : event.type === 'coffee_break' ? '☕' : '🎉'}
            </span>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--neu-text)' }}>
                {event.initiator?.displayName} started a hangout!
              </p>
              <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                Tap to respond
              </p>
            </div>
          </div>
        ), { duration: 8000 });
      }
    });

    socket.on(SocketEvents.HANGOUT_UPDATED, (event: HangoutEvent) => {
      updateActiveEvent(event);
    });

    // ── Notification ───────────────────────────────────────────
    socket.on(SocketEvents.NOTIFICATION, (notif: Notification) => {
      addNotification({
        type: notif.type,
        title: notif.title,
        body: notif.body,
        data: notif.data,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, accessToken, user?.id]);

  const emit = (event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, emit }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
