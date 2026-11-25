import { isAdmin } from '@/lib/admin/guard';
import { LIMITS } from '@/lib/admin/menu-import';
import { stage } from '@/lib/admin/menu-import-store';

export const dynamic = 'force-dynamic';

const back = (qs: string) =>
  new Response(null, { status: 303, headers: { Location: `/admin/menu/import?${qs}` } });

/** POST multipart: sheet (.csv/.xlsx, required) + images (.zip, optional). Stores nothing in the CMS. */
export async function POST(request: Request): Promise<Response> {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });

  // Reject obviously oversized bodies before buffering them.
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > LIMITS.zipBytes + LIMITS.sheetBytes + 1024 * 1024) return back('err=toolarge');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back('err=upload');
  }

  const sheet = form.get('sheet');
  const zip = form.get('images');
  if (!(sheet instanceof File) || sheet.size === 0) return back('err=nosheet');
  const ext = sheet.name.toLowerCase().endsWith('.xlsx') ? 'xlsx' : sheet.name.toLowerCase().endsWith('.csv') ? 'csv' : null;
  if (!ext) return back('err=sheettype');
  if (sheet.size > LIMITS.sheetBytes) return back('err=sheetsize');

  let zipBuf: Buffer | null = null;
  if (zip instanceof File && zip.size > 0) {
    if (!zip.name.toLowerCase().endsWith('.zip')) return back('err=ziptype');
    if (zip.size > LIMITS.zipBytes) return back('err=zipsize');
    zipBuf = Buffer.from(await zip.arrayBuffer());
    if (zipBuf[0] !== 0x50 || zipBuf[1] !== 0x4b) return back('err=ziptype');
  }

  const token = await stage(Buffer.from(await sheet.arrayBuffer()), ext, zipBuf);
  return back(`t=${token}`);
}
