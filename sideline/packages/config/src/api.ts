/**
 * API connectivity configuration.
 *
 * The mobile app talks to the Sideline API for live research. Keys always
 * stay server-side; the client only ever sees this base URL.
 */
export const DEFAULT_DEV_API_URL = 'http://localhost:3000';

/** Production API URL. Replace with the real Render service URL once deployed. */
export const DEFAULT_PROD_API_URL = 'https://sideline-api.onrender.com';

function readEnv(name: string): string | undefined {
  try {
    const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } })
      .process;
    return proc?.env?.[name];
  } catch {
    return undefined;
  }
}

function isDev(): boolean {
  const flag = (globalThis as Record<string, unknown>).__DEV__;
  return flag !== false;
}

/** Resolve the API base URL: explicit override > env > dev/prod default. */
export function resolveApiBaseUrl(explicit?: string): string {
  if (explicit) return explicit.replace(/\/$/, '');
  const fromEnv = readEnv('SIDELINE_API_URL') ?? readEnv('EXPO_PUBLIC_API_URL');
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return isDev() ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL;
}
