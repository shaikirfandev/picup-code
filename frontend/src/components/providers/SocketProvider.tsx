'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addNotification,
  notificationRead,
  allNotificationsRead,
  fetchUnreadCount,
} from '@/store/slices/notificationSlice';
import { Notification } from '@/types';
import { SocketContext } from './SocketContext';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500').replace('/api', '');

export { useSocket } from './SocketContext';

/**
 * Wraps children with live socket context.
 * Must be loaded via next/dynamic({ ssr: false }) to avoid SSR issues with socket.io-client.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    s.on('connect', () => {
      console.log('🔌 Socket connected');
      dispatch(fetchUnreadCount());
    });

    s.on('new-notification', (notification: Notification) => {
      dispatch(addNotification(notification));
    });

    s.on('notification-read', (data: { _id: string }) => {
      dispatch(notificationRead(data._id));
    });

    s.on('all-notifications-read', () => {
      dispatch(allNotificationsRead());
    });

    s.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    s.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated, dispatch]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketProvider;
