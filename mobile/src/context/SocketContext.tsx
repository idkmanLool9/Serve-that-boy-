import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

type ChangeListener = () => void;

interface RealtimeContextValue {
  connected: boolean;
  /** Called whenever a request in the family changes. Returns an unsubscribe fn. */
  subscribe: (listener: ChangeListener) => () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

/**
 * Subscribes to Postgres changes on the `requests` table (scoped to the user's
 * family) and notifies listeners so they can refetch. Replaces the previous
 * Socket.io server with Supabase Realtime — no backend to host.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Set<ChangeListener>>(new Set());

  useEffect(() => {
    if (!user) {
      setConnected(false);
      return;
    }

    const channel: RealtimeChannel = supabase
      .channel(`requests:${user.familyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
          filter: `family_id=eq.${user.familyId}`,
        },
        () => {
          listenersRef.current.forEach((listener) => listener());
        },
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [user]);

  const subscribe = (listener: ChangeListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  };

  return (
    <RealtimeContext.Provider value={{ connected, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useSocket(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useSocket must be used within a SocketProvider');
  return ctx;
}
