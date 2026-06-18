import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchMe, login as apiLogin, logout as apiLogout, signup as apiSignup, SignupInput } from '../api/client';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: SignupInput) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const me = await fetchMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    // Initial session restore.
    loadProfile().finally(() => setInitializing(false));

    // React to sign-in / sign-out / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        loadProfile();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await apiLogin(email, password);
      await loadProfile();
    },
    [loadProfile],
  );

  const register = useCallback(async (input: SignupInput) => {
    const res = await apiSignup(input);
    // If a session was created, onAuthStateChange will load the profile.
    return res;
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, initializing, signIn, register, signOut }),
    [user, initializing, signIn, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
