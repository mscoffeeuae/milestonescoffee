import { chmod, readFile, writeFile } from 'node:fs/promises';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { checkPassword as checkEnvPassword } from './session';

/**
 * Password storage. The hash file (scrypt) wins; ADMIN_PASSWORD from the
 * environment is only the fallback when the file is missing/empty/invalid.
 */
const N = 16384, R = 8, P = 1, KEYLEN = 64;
export const MIN_PASSWORD_LENGTH = 12;

export function authFilePath(): string {
  return process.env['ADMIN_AUTH_FILE'] || '/opt/milestones/admin-auth.json';
}

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, KEYLEN, { N, r: R, p: P }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

async function readStoredHash(): Promise<string | null> {
  try {
    const j = JSON.parse(await readFile(/* turbopackIgnore: true */ authFilePath(), 'utf8')) as { hash?: unknown };
    return typeof j.hash === 'string' && j.hash.startsWith('scrypt$') ? j.hash : null;
  } catch {
    return null; // missing, empty or unreadable -> fall back to env
  }
}

async function verifyHash(stored: string, password: string): Promise<boolean> {
  const [, n, r, p, saltB64, hashB64] = stored.split('$');
  if (n !== String(N) || r !== String(R) || p !== String(P) || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await derive(password, Buffer.from(saltB64, 'base64'));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** True when some password source exists (file hash or ADMIN_PASSWORD) plus the signing secret. */
export async function passwordConfigured(): Promise<boolean> {
  if (!process.env['ADMIN_SESSION_SECRET']) return false;
  return (await readStoredHash()) !== null || Boolean(process.env['ADMIN_PASSWORD']);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = await readStoredHash();
  if (stored) return verifyHash(stored, password);
  return checkEnvPassword(password);
}

export async function savePassword(password: string): Promise<void> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  const hash = `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
  const path = authFilePath();
  // Written in place (not rename) so it also works when the file is a single-file Docker bind mount.
  await writeFile(path, JSON.stringify({ v: 1, hash, updatedAt: new Date().toISOString() }), { mode: 0o600 });
  await chmod(path, 0o600).catch(() => undefined);
}
