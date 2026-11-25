/**
 * Admin session — stateless signed cookie (HMAC-SHA256, Web Crypto so it runs
 * in both the proxy and Node server code). No secrets are hard-coded: the
 * password comes from ADMIN_PASSWORD and the signing key from ADMIN_SESSION_SECRET.
 */
export const ADMIN_COOKIE = 'admin_session';
export const ADMIN_SESSION_SECONDS = 12 * 60 * 60;

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** True when both required variables exist; otherwise login is disabled (fail closed). */
export function adminConfigured(): boolean {
  return Boolean(process.env['ADMIN_PASSWORD'] && process.env['ADMIN_SESSION_SECRET']);
}

/** Constant-time password check against ADMIN_PASSWORD. */
export async function checkPassword(candidate: string): Promise<boolean> {
  const expected = process.env['ADMIN_PASSWORD'];
  const secret = process.env['ADMIN_SESSION_SECRET'];
  if (!expected || !secret) return false;
  // Hash both so length differences don't leak through comparison timing.
  const [a, b] = await Promise.all([hmac(secret, `pw:${candidate}`), hmac(secret, `pw:${expected}`)]);
  return equalBytes(a, b);
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env['ADMIN_SESSION_SECRET'];
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set');
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now() + ADMIN_SESSION_SECONDS * 1000 })));
  const sig = b64url(await hmac(secret, payload));
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  const secret = process.env['ADMIN_SESSION_SECRET'];
  if (!secret || !token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  const expected = b64url(await hmac(secret, payload));
  if (!equalBytes(enc.encode(sig), enc.encode(expected))) return false;
  try {
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
    return typeof json.exp === 'number' && json.exp > Date.now();
  } catch {
    return false;
  }
}
