import { randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { ImportSummary } from './menu-import';

/**
 * Short-lived staging area between "preview" and "confirm". The confirm step re-parses
 * these server-held files (never anything the browser sends back), so what was previewed
 * is exactly what is written. Entries expire after one hour.
 */
const ROOT = path.join(tmpdir(), 'ms-menu-import');
const TTL_MS = 60 * 60 * 1000;
const TOKEN = /^[a-f0-9]{32}$/;

export const validToken = (t: string | undefined | null): t is string => typeof t === 'string' && TOKEN.test(t);
const dir = (t: string) => path.join(ROOT, t);

async function sweep() {
  try {
    for (const name of await readdir(ROOT)) {
      const p = path.join(ROOT, name);
      if (Date.now() - (await stat(p)).mtimeMs > TTL_MS) await rm(p, { recursive: true, force: true });
    }
  } catch { /* nothing staged yet */ }
}

export async function stage(sheet: Buffer, ext: 'csv' | 'xlsx', zip: Buffer | null): Promise<string> {
  await sweep();
  const token = randomBytes(16).toString('hex');
  await mkdir(dir(token), { recursive: true, mode: 0o700 });
  await writeFile(path.join(dir(token), `sheet.${ext}`), sheet, { mode: 0o600 });
  if (zip) await writeFile(path.join(dir(token), 'images.zip'), zip, { mode: 0o600 });
  return token;
}

export async function load(token: string): Promise<{ sheet: Buffer; ext: 'csv' | 'xlsx'; zip: Buffer | null } | null> {
  if (!validToken(token)) return null;
  for (const ext of ['csv', 'xlsx'] as const) {
    try {
      const sheet = await readFile(path.join(dir(token), `sheet.${ext}`));
      const zip = await readFile(path.join(dir(token), 'images.zip')).catch(() => null);
      return { sheet, ext, zip };
    } catch { /* try next */ }
  }
  return null;
}

/** Claims the import so a double-click cannot write twice. Returns false if already claimed. */
export async function claim(token: string): Promise<boolean> {
  if (!validToken(token)) return false;
  try {
    await writeFile(path.join(dir(token), 'claimed'), '1', { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
}

export async function saveSummary(token: string, s: ImportSummary): Promise<void> {
  await writeFile(path.join(dir(token), 'summary.json'), JSON.stringify(s), { mode: 0o600 });
  // Source files are no longer needed once the import ran.
  await rm(path.join(dir(token), 'images.zip'), { force: true });
  await rm(path.join(dir(token), 'sheet.csv'), { force: true });
  await rm(path.join(dir(token), 'sheet.xlsx'), { force: true });
}

export async function loadSummary(token: string): Promise<ImportSummary | null> {
  if (!validToken(token)) return null;
  try {
    return JSON.parse(await readFile(path.join(dir(token), 'summary.json'), 'utf8')) as ImportSummary;
  } catch {
    return null;
  }
}

export async function discard(token: string): Promise<void> {
  if (validToken(token)) await rm(dir(token), { recursive: true, force: true });
}
