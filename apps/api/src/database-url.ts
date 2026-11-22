type Env = Record<string, string | undefined>;

export function databaseUrl(env: Env = process.env): string | undefined {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const { DB_HOST = 'localhost', DB_PORT = '5432', DB_USER, DB_PASSWORD = '', DB_NAME } = env;
  if (!DB_USER || !DB_NAME) return undefined;
  return `postgresql://${encodeURIComponent(DB_USER)}:${encodeURIComponent(DB_PASSWORD)}@${DB_HOST}:${DB_PORT}/${encodeURIComponent(DB_NAME)}`;
}
