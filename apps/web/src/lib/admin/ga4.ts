import { createSign } from 'node:crypto';

/**
 * Minimal GA4 Data API client (REST + service-account JWT) — no extra dependency.
 * Everything degrades to { status: 'not-configured' } when env vars are missing.
 */
interface ServiceAccount { client_email: string; private_key: string }

export interface Row { dims: string[]; metrics: number[] }
export type GaResult<T> =
  | { status: 'not-configured' }
  | { status: 'error' }
  | { status: 'ok'; data: T };

function loadAccount(): ServiceAccount | null {
  const raw = process.env['GA_SERVICE_ACCOUNT_JSON']?.trim();
  if (!raw || !process.env['GA_PROPERTY_ID']) return null;
  try {
    const text = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const j = JSON.parse(text) as Partial<ServiceAccount>;
    if (!j.client_email || !j.private_key) return null;
    return { client_email: j.client_email, private_key: j.private_key.replace(/\\n/g, '\n') };
  } catch {
    return null;
  }
}

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
let tokenCache: { token: string; exp: number } | null = null;

async function accessToken(acc: ServiceAccount): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64(JSON.stringify({
    iss: acc.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))}`;
  const sig = createSign('RSA-SHA256').update(unsigned).sign(acc.private_key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

interface ReportReq {
  dimensions?: string[];
  metrics: string[];
  days: number;
  limit?: number;
  orderBy?: { metric?: string; dimension?: string; desc?: boolean };
  pathContains?: string;
}

const memo = new Map<string, { at: number; rows: Row[]; totals: number[] }>();

async function run(acc: ServiceAccount, r: ReportReq): Promise<{ rows: Row[]; totals: number[] }> {
  const key = JSON.stringify(r);
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit;
  const token = await accessToken(acc);
  const body: Record<string, unknown> = {
    dateRanges: [{ startDate: `${r.days}daysAgo`, endDate: 'today' }],
    dimensions: (r.dimensions ?? []).map((name) => ({ name })),
    metrics: r.metrics.map((name) => ({ name })),
    limit: r.limit ?? 10,
    metricAggregations: ['TOTAL'],
  };
  if (r.orderBy) {
    body['orderBys'] = [r.orderBy.metric
      ? { metric: { metricName: r.orderBy.metric }, desc: r.orderBy.desc ?? true }
      : { dimension: { dimensionName: r.orderBy.dimension }, desc: r.orderBy.desc ?? false }];
  }
  if (r.pathContains) {
    body['dimensionFilter'] = { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'CONTAINS', value: r.pathContains } } };
  }
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${process.env['GA_PROPERTY_ID']}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`runReport ${res.status}`);
  const j = (await res.json()) as {
    rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[];
    totals?: { metricValues?: { value: string }[] }[];
  };
  const out = {
    at: Date.now(),
    rows: (j.rows ?? []).map((row) => ({
      dims: (row.dimensionValues ?? []).map((d) => d.value),
      metrics: (row.metricValues ?? []).map((m) => Number(m.value)),
    })),
    totals: (j.totals?.[0]?.metricValues ?? []).map((m) => Number(m.value)),
  };
  memo.set(key, out);
  return out;
}

export interface GaReport {
  views: number;
  users: number;
  daily: { date: string; views: number }[];
  topBranchPages: Row[];
  devices: Row[];
  topPages: Row[];
  sources: Row[];
  countries: Row[];
}

/** `full` adds top pages, sources and countries (analytics page). */
export async function getGaReport(days: number, full: boolean): Promise<GaResult<GaReport>> {
  const acc = loadAccount();
  if (!acc) return { status: 'not-configured' };
  try {
    const [daily, branchPages, devices, pages, sources, countries] = await Promise.all([
      run(acc, { dimensions: ['date'], metrics: ['screenPageViews', 'totalUsers'], days, limit: 120, orderBy: { dimension: 'date' } }),
      run(acc, { dimensions: ['pagePath'], metrics: ['screenPageViews'], days, limit: 8, orderBy: { metric: 'screenPageViews' }, pathContains: '/locations/' }),
      run(acc, { dimensions: ['deviceCategory'], metrics: ['totalUsers'], days, limit: 5, orderBy: { metric: 'totalUsers' } }),
      full ? run(acc, { dimensions: ['pagePath'], metrics: ['screenPageViews'], days, limit: 15, orderBy: { metric: 'screenPageViews' } }) : null,
      full ? run(acc, { dimensions: ['sessionSource'], metrics: ['sessions'], days, limit: 10, orderBy: { metric: 'sessions' } }) : null,
      full ? run(acc, { dimensions: ['country'], metrics: ['totalUsers'], days, limit: 10, orderBy: { metric: 'totalUsers' } }) : null,
    ]);
    return {
      status: 'ok',
      data: {
        views: daily.totals[0] ?? 0,
        users: daily.totals[1] ?? 0, // period total from the API (not a sum of daily users)
        daily: daily.rows.map((r) => ({ date: r.dims[0] ?? '', views: r.metrics[0] ?? 0 })),
        topBranchPages: branchPages.rows,
        devices: devices.rows,
        topPages: pages?.rows ?? [],
        sources: sources?.rows ?? [],
        countries: countries?.rows ?? [],
      },
    };
  } catch (err) {
    console.error('[admin] GA4 report failed', err instanceof Error ? err.message : err);
    return { status: 'error' };
  }
}
