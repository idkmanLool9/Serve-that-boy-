import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET', 'change-me-to-a-long-random-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  isProduction: process.env.NODE_ENV === 'production',
};
