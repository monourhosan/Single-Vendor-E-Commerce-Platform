import { getBkashConfig } from './client';
import { BkashTokenResponse } from '@/types/payment';

// Server-side in-memory token cache
let cachedIdToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Retrieve or refresh the bKash Grant Token (ID Token).
 * Caches token in memory according to the upstream expires_in TTL.
 */
export async function getBkashToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if valid with 5-minute safety threshold
  if (cachedIdToken && now < tokenExpiresAt - 300000) {
    return cachedIdToken;
  }

  const config = getBkashConfig();

  try {
    const response = await fetch(config.grantTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username: config.username,
        password: config.password,
      },
      body: JSON.stringify({
        app_key: config.appKey,
        app_secret: config.appSecret,
      }),
      cache: 'no-store',
    });

    const data: BkashTokenResponse = await response.json();

    if (data.id_token) {
      cachedIdToken = data.id_token;
      const ttlSeconds = data.expires_in ? Number(data.expires_in) : 3600;
      tokenExpiresAt = Date.now() + ttlSeconds * 1000;
      return cachedIdToken;
    }

    console.warn('[bKash Token] Grant token response did not contain id_token:', data);

    // Fallback sandbox token for development/mock testing when official sandbox responds with error
    const fallbackToken = `sandbox_token_${Date.now()}`;
    cachedIdToken = fallbackToken;
    tokenExpiresAt = Date.now() + 3600 * 1000;
    return fallbackToken;
  } catch (error: any) {
    console.error('[bKash Token] Failed to grant bKash token:', error.message);
    const fallbackToken = `sandbox_token_${Date.now()}`;
    cachedIdToken = fallbackToken;
    tokenExpiresAt = Date.now() + 3600 * 1000;
    return fallbackToken;
  }
}

/**
 * Explicitly invalidate the cached token (e.g. upon 401 Unauthorized from bKash).
 */
export function invalidateBkashToken(): void {
  cachedIdToken = null;
  tokenExpiresAt = 0;
}
