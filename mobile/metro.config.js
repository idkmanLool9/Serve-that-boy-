const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @supabase/supabase-js does an optional dynamic import of "@opentelemetry/api"
// for tracing. It's wrapped in a try/catch and not needed here, but Metro tries
// to resolve it statically and fails. Resolve it to an empty module instead.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@opentelemetry/api') {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
