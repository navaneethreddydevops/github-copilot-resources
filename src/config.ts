export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  /** Token lifetime in seconds. */
  jwtExpiresIn: number;
  /** '*' or a list of allowed origins. */
  corsOrigin: string | string[];
  logLevel: string;
  /** 5-field cron expression, or 'off'. */
  cleanupCron: string;
}

const DEV_JWT_SECRET = 'dev-secret-change-me';

function parseIntOr(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name}: expected a positive integer, got "${value}"`);
  }
  return parsed;
}

function parseCorsOrigin(value: string | undefined): string | string[] {
  if (value === undefined || value.trim() === '' || value.trim() === '*') return '*';
  const origins = value.split(',').map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const jwtSecret = env.JWT_SECRET ?? DEV_JWT_SECRET;
  if (nodeEnv === 'production' && jwtSecret === DEV_JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production');
  }
  return {
    nodeEnv,
    port: parseIntOr(env.PORT, 3000, 'PORT'),
    databaseUrl: env.DATABASE_URL ?? 'postgres://app:app@localhost:5432/app',
    jwtSecret,
    jwtExpiresIn: parseIntOr(env.JWT_EXPIRES_IN, 3600, 'JWT_EXPIRES_IN'),
    corsOrigin: parseCorsOrigin(env.CORS_ORIGIN),
    logLevel: env.LOG_LEVEL ?? 'info',
    cleanupCron: env.CLEANUP_CRON?.trim() || '*/5 * * * *',
  };
}
