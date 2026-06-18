import Constants from 'expo-constants';

/**
 * Resolve the backend URL. Priority:
 *   1. EXPO_PUBLIC_API_URL env var (recommended for real devices on a LAN)
 *   2. `extra.apiUrl` in app.json
 *   3. localhost fallback
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'http://localhost:4000';
