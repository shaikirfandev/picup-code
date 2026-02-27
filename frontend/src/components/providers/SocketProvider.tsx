'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  addNotification,
  notificationRead,
  allNotificationsRead,
  fetchUnreadCount,
} from '@/store/slices/notificationSlice';
import { Notification } from '@/types';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4500').replace('/api', '');

const SocketContext = createContext<Socket | null>(null);

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      // Fetch initial unread count on connect
      dispatch(fetchUnreadCount());
    });

    socket.on('new-notification', (notification: Notification) => {
      dispatch(addNotification(notification));
    });

    socket.on('notification-read', (data: { _id: string }) => {
      dispatch(notificationRead(data._id));
    });

    socket.on('all-notifications-read', () => {
      dispatch(allNotificationsRead());
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, dispatch]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}
