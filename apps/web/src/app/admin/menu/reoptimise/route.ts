import { logActivity } from '@/lib/admin/activity';
import { isAdmin } from '@/lib/admin/guard';
import { listImageStatus, reoptimiseProduct, writeConfigured } from '@/lib/admin/menu-data';
import { ImageError } from '@/lib/admin/image-optimise';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** GET -> { ids: string[], skipped: number } : products with an image that still need optimising. */
export async function GET(): Promise<Response> {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });
  if (!writeConfigured()) return json({ ok: false, code: 'config' }, 503);
  const all = await listImageStatus();
  return json({ ok: true, ids: all.filter((r) => !r.optimised).map((r) => r.id), skipped: all.filter((r) => r.optimised).length });
}

/** POST {id} -> optimises one product's image. The browser calls this once per item to show progress. */
export async function POST(request: Request): Promise<Response> {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });
  if (!writeConfigured()) return json({ ok: false, code: 'config' }, 503);
  let id = '';
  try {
    id = String(((await request.json()) as { id?: unknown }).id ?? '');
  } catch {
    /* fall through */
  }
  if (!/^[\w.-]{1,128}$/.test(id)) return json({ ok: false, code: 'id' }, 400);
  try {
    const result = await reoptimiseProduct(id);
    if (result === 'done') {
      await logActivity({ action: 'edit', entityType: 'menu', entityId: id, label: id, detail: 'image re-optimised' });
      for (const p of ['/en/menu', '/ar/menu', '/en', '/ar']) revalidatePath(p);
    }
    return json({ ok: true, result });
  } catch (err) {
    const message = err instanceof ImageError ? err.message : err instanceof Error ? err.message.slice(0, 160) : 'failed';
    console.error('[admin/menu] reoptimise failed', id, message);
    return json({ ok: false, code: 'failed', message }, 200);
  }
}
