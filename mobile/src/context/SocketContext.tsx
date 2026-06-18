import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { TOKEN_KEY } from '../api/client';
import { useAuth } from './AuthContext';
import { FamilyRequest } from '../types';

export type RequestEventName =
  | 'request:created'
  | 'request:accepted'
  | 'request:completed'
  | 'request:replied';

type Listener = (event: RequestEventName, request: FamilyRequest) => void;

interface SocketContextValue {
  connected: boolean;
  /** Subscribe to all request events. Returns an unsubscribe function. */
  subscribe: (listener: Listener) => () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

const EVENTS: RequestEventName[] = [
  'request:created',
  'request:accepted',
  'request:completed',
  'request:replied',
];

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Set<Listener>>(new Set());

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
      return;
    }

    let active = true;
    (async () => {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token || !active) return;

      const socket = io(API_URL, {
        auth: { token },
        transports: ['websocket'],
      });
      socketRef.current = socket;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));

      EVENTS.forEach((event) => {
        socket.on(event, (request: FamilyRequest) => {
          listenersRef.current.forEach((listener) => listener(event, request));
        });
      });
    })();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const subscribe = (listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  };

  return (
    <SocketContext.Provider value={{ connected, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
