import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl || '';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Surfaced clearly during development if config is missing.
  console.warn('Supabase URL or anon key is not configured. See mobile/README.md.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // We do not use OAuth redirect/magic links, so don't parse the URL hash.
    detectSessionInUrl: false,
  },
});
