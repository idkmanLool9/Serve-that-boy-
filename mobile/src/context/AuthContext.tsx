import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchMe,
  login as apiLogin,
  savePushToken,
  signup as apiSignup,
  SignupInput,
  TOKEN_KEY,
} from '../api/client';
import { registerForPushNotifications } from '../notifications';
import { AuthResponse, User } from '../types';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: SignupInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Restore session on launch.
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const me = await fetchMe();
          setUser(me);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // After a successful auth, persist the token, set the user, and register push.
  const handleAuth = useCallback(async (res: AuthResponse) => {
    await AsyncStorage.setItem(TOKEN_KEY, res.token);
    setUser(res.user);
    const pushToken = await registerForPushNotifications();
    if (pushToken) {
      await savePushToken(pushToken).catch(() => undefined);
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email, password);
      await handleAuth(res);
    },
    [handleAuth],
  );

  const register = useCallback(
    async (input: SignupInput) => {
      const res = await apiSignup(input);
      await handleAuth(res);
    },
    [handleAuth],
  );

  const signOut = useCallback(async () => {
    await savePushToken(null).catch(() => undefined);
    await AsyncStorage.removeItem(TOKEN_KEY);
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
