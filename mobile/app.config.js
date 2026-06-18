// Dynamic Expo config. Merges static settings from app.json and injects:
//   - Supabase connection (URL + publishable/anon key; safe to ship publicly
//     because Row Level Security protects the data).
//   - The web base path, so the static export works under a GitHub Pages
//     subdirectory like https://<user>.github.io/<repo>/.
//
// All values can be overridden with environment variables, which is how the
// GitHub Actions deploy workflow configures the production build.

const appJson = require('./app.json');

// Defaults point at the project provisioned for this app. Override via env.
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://jvxbbpzmmnrtcbmerfla.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2eGJicHptbW5ydGNibWVyZmxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3OTkxNzEsImV4cCI6MjA5NzM3NTE3MX0.cmdhyfMmpAvwySNq1WxrfyGK_Tx_aiK4Z5X87F2T_U4';

// e.g. "/serve-that-boy-" on GitHub Pages; "/" for local dev and custom domains.
const BASE_URL = process.env.EXPO_BASE_URL || '/';

module.exports = () => ({
  ...appJson.expo,
  experiments: {
    ...(appJson.expo.experiments ?? {}),
    baseUrl: BASE_URL === '/' ? undefined : BASE_URL.replace(/\/$/, ''),
  },
  extra: {
    ...(appJson.expo.extra ?? {}),
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
  },
});
