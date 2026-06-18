import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  completeSetup as apiCompleteSetup,
  fetchMe,
  hasActiveSession,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
  SetupInput,
  SignupInput,
} from '../api/client';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  /** Signed in, but hasn't created/joined a family yet. */
  needsSetup: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: SignupInput) => Promise<{ needsConfirmation: boolean }>;
  completeSetup: (input: SetupInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Load the current session and (if present) the user's profile.
  const refresh = useCallback(async () => {
    try {
      const session = await hasActiveSession();
      setHasSession(session);
      setUser(session ? await fetchMe() : null);
    } catch {
      setHasSession(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setInitializing(false));

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setHasSession(false);
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        refresh();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await apiLogin(email, password);
      await refresh();
    },
    [refresh],
  );

  const register = useCallback((input: SignupInput) => apiSignup(input), []);

  const completeSetup = useCallback(
    async (input: SetupInput) => {
      await apiCompleteSetup(input);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    await apiLogout();
    setHasSession(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      needsSetup: hasSession && !user,
      initializing,
      signIn,
      register,
      completeSetup,
      signOut,
    }),
    [user, hasSession, initializing, signIn, register, completeSetup, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
