import { isAdmin } from '@/lib/admin/guard';
import { ImageError, MAX_INPUT_BYTES, optimiseImage } from '@/lib/admin/image-optimise';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST multipart `image` -> JSON with before/after sizes and an optimised preview (data URL).
 * Writes nothing; the real optimisation runs again on save.
 */
export async function POST(request: Request): Promise<Response> {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_INPUT_BYTES + 512 * 1024) return json({ ok: false, code: 'size' }, 413);
  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get('image');
  } catch {
    return json({ ok: false, code: 'upload' }, 400);
  }
  if (!(file instanceof File) || file.size === 0) return json({ ok: false, code: 'upload' }, 400);

  try {
    const o = await optimiseImage(Buffer.from(await file.arrayBuffer()));
    return json({
      ok: true,
      before: { bytes: o.originalBytes, width: o.originalWidth, height: o.originalHeight },
      after: {
        bytes: o.fullBytes,
        width: o.width,
        height: o.height,
        thumbBytes: o.thumbBytes,
        avifBytes: o.avifBytes,
        keptOriginal: o.keptOriginal,
        dataUrl: `data:${o.fullType};base64,${o.full.toString('base64')}`,
      },
      savedBytes: o.originalBytes - o.fullBytes,
    });
  } catch (err) {
    if (err instanceof ImageError) return json({ ok: false, code: err.code }, 422);
    console.error('[admin/images] preview failed', err instanceof Error ? err.message : err);
    return json({ ok: false, code: 'decode' }, 500);
  }
}
