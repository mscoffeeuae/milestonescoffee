/**
 * TEMPORARY dev-only route: imports Milestones Coffee branches (source: Google Maps listings,
 * fetched 2026-11-20) into Sanity. Token read server-side from repo-root .env.env; never returned.
 * Delete this file after the import.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@sanity/client';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
type H = [string, string] | null; // [open, close] or closed
const week = (all: H, over: Record<string, H> = {}) =>
  Object.fromEntries(
    DAYS.flatMap((d) => {
      const h = d in over ? over[d] : all;
      return h ? [[`${d}Open`, h[0]], [`${d}Close`, h[1]], [`${d}Closed`, false]] : [[`${d}Closed`, true]];
    }),
  );
const STD = week(['06:30', '23:30']);
const maps = (id: string) => `https://www.google.com/maps/place/?q=place_id:${id}`;

const BRANCHES = [
  { slug: 'baynunah', en: 'Milestones Coffee Baynunah', ar: 'مايلستونز كوفي بينونة', em: 'abu-dhabi', addr: '16 Al Layyanah St, Al Hisn, Al Markaziyah West, Abu Dhabi', lat: 24.4822668, lng: 54.3511504, pid: 'ChIJE70jL71nXj4RKB25km7Wv-M', phone: '+971 2 444 2792', hours: STD },
  { slug: 'almuhairy-center', en: 'Milestones Coffee Almuhairy Center (Nayel & Bin Harmal Tower)', ar: 'مايلستونز كوفي مركز المهيري', em: 'abu-dhabi', addr: 'Nayel & Bin Harmal Tower, Almuhairy Center, Al Hisn, Abu Dhabi', lat: 24.4804375, lng: 54.3571875, pid: 'ChIJJxJ0FQdnXj4RaQ6x4QhLLN4', phone: '+971 2 559 9644', hours: STD },
  { slug: 'abu-dhabi-mall', en: 'Milestones Coffee Abu Dhabi Mall', ar: 'مايلستونز كوفي أبوظبي مول', em: 'abu-dhabi', addr: 'Abu Dhabi Mall, Al Zahiyah, Abu Dhabi', lat: 24.4955706, lng: 54.3835819, pid: 'ChIJq35Q_KtnXj4RH_Dqa9ggEQ4', phone: '+971 2 583 6444', hours: week(['07:00', '23:00'], { friday: ['07:00', '00:00'], saturday: ['07:00', '00:00'] }) },
  { slug: 'khalifa-park', en: 'Milestones Coffee Khalifa Park', ar: 'مايلستونز كوفي حديقة خليفة', em: 'abu-dhabi', addr: 'Khalifa Park, Al Muntazah, Ministries Complex, Abu Dhabi', lat: 24.430477, lng: 54.4638734, pid: 'ChIJgRcMbepDXj4Ri9kLCj3hp9I', phone: '+971 2 562 2867', hours: week(['06:30', '20:00'], { saturday: ['08:00', '17:00'], sunday: null }) },
  { slug: 'al-manhal', en: 'Milestones Coffee Al Manhal', ar: 'مايلستونز كوفي المنهل', em: 'abu-dhabi', addr: 'Al Manhal, Zone 1, Abu Dhabi', lat: 24.477188, lng: 54.364563, pid: 'ChIJXaKL1ctnXj4R9-IsPbWVXHE', phone: '+971 2 886 9393', hours: STD },
  { slug: 'al-mamoura', en: 'Milestones Coffee Al Mamoura', ar: 'مايلستونز كوفي المعمورة', em: 'abu-dhabi', addr: '15th Street & Muroor Road, Al Mamoura, Abu Dhabi', lat: 24.4649409, lng: 54.3876001, pid: 'ChIJgRDvbnVnXj4RJWLwK9_BwDo', phone: '+971 2 555 2522', hours: STD },
  { slug: 'al-raha-beach', en: 'Milestones Coffee Al Raha Beach', ar: 'مايلستونز كوفي شاطئ الراحة', em: 'abu-dhabi', addr: 'Al Raha Beach, Abu Dhabi', lat: 24.4535897, lng: 54.6095739, pid: 'ChIJS-hMuNNPXj4RVPya1kYu2FM', phone: '+971 2 886 5877', hours: week(['07:00', '23:00']) },
  { slug: 'al-zahiyah', en: 'Milestones Coffee Al Zahiyah', ar: 'مايلستونز كوفي الزاهية', em: 'abu-dhabi', addr: 'Al Zahiyah St, Al Zahiyah, Abu Dhabi', lat: 24.4979127, lng: 54.373543, pid: 'ChIJN2MGBQBnXj4RTbqmv6Oz4CI', phone: '+971 2 582 2203', hours: STD },
  { slug: 'salam-street', en: 'Milestones Coffee Salam Street', ar: 'مايلستونز كوفي شارع السلام', em: 'abu-dhabi', addr: 'Al Sikeek Street, Al Danah, Abu Dhabi', lat: 24.4987752, lng: 54.3702258, pid: 'ChIJ_9J4rvBpXj4ReLT-ejh9x3I', phone: '+971 2 546 6811', hours: STD },
  { slug: 'hili-mall-al-ain', en: 'Milestones Coffee Hili Mall (Al Ain)', ar: 'مايلستونز كوفي هيلي مول', em: 'abu-dhabi', addr: 'Hili Mall, Bani Yas St, Hili, Al Ain', lat: 24.2739529, lng: 55.7796512, pid: 'ChIJhykRyq61ij4RxtI4wND6bPQ', phone: '+971 3 734 2927', hours: null },
  { slug: 'garhoud', en: 'Milestones Coffee Garhoud', ar: 'مايلستونز كوفي القرهود', em: 'dubai', addr: "Makeen Properties, Airport Rd, Al Garhoud, Dubai", lat: 25.253186, lng: 55.3429434, pid: 'ChIJCT0RMlpdXz4RyrBZJVWFkgU', phone: null, hours: week(['07:00', '18:00'], { saturday: ['07:00', '01:00'], sunday: null }) },
];

function token(): string | undefined {
  try {
    const env = readFileSync(join(process.cwd(), '..', '..', '.env.env'), 'utf8');
    return env.match(/^SANITY_API_TOKEN=["']?([^"'\r\n]+)/m)?.[1];
  } catch {
    return undefined;
  }
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development') return new Response('Not found', { status: 404 });
  const t = token();
  if (!t) return Response.json({ ok: false, error: 'SANITY_API_TOKEN not found' }, { status: 500 });
  const dryRun = new URL(req.url).searchParams.get('run') !== '1';

  const client = createClient({ projectId: 'txh3gqgo', dataset: 'production', apiVersion: '2024-01-01', token: t, useCdn: false });
  const tx = client.transaction();
  for (const b of BRANCHES) {
    tx.createOrReplace({
      _id: `branch-${b.slug}`,
      _type: 'branch',
      nameEn: b.en,
      nameAr: b.ar,
      slug: { _type: 'slug', current: b.slug },
      isActive: true,
      emirate: b.em,
      addressEn: b.addr,
      googleMapsUrl: maps(b.pid),
      coordinates: { lat: b.lat, lng: b.lng },
      ...(b.hours ? { openingHours: { _type: 'openingHours', ...b.hours } } : {}),
      ...(b.phone ? { phone: b.phone } : {}),
    });
  }
  try {
    const res = await tx.commit({ dryRun, visibility: 'sync' } as never);
    return Response.json({ ok: true, dryRun, count: BRANCHES.length, results: (res as { results?: unknown[] }).results?.length });
  } catch (e) {
    return Response.json({ ok: false, dryRun, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
