import { isAdmin } from '@/lib/admin/guard';
import { listCategories, listProducts } from '@/lib/admin/menu-data';
import { exportRows, templateRows, toCsv, toXlsx } from '@/lib/admin/menu-import';

export const dynamic = 'force-dynamic';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** GET /admin/menu/export?format=csv|xlsx[&template=1] */
export async function GET(request: Request): Promise<Response> {
  if (!(await isAdmin())) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const format = url.searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  const template = url.searchParams.get('template') === '1';
  const stamp = new Date().toISOString().slice(0, 10);
  const name = template ? 'menu-template' : `menu-export-${stamp}`;

  const categories = await listCategories();
  const rows = template
    ? templateRows(categories[0]?.nameEn ?? '', format === 'xlsx')
    : exportRows(await listProducts(), categories, format === 'xlsx');

  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
  if (format === 'xlsx') {
    const buf = await toXlsx(rows);
    return new Response(new Uint8Array(buf), {
      headers: { ...headers, 'Content-Type': XLSX, 'Content-Disposition': `attachment; filename="${name}.xlsx"` },
    });
  }
  return new Response(toCsv(rows.map((r) => r.map(String))), {
    headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}.csv"` },
  });
}
