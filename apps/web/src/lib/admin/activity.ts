import { randomBytes } from 'node:crypto';
import { readClient, writeClient } from './sanity-client';

/** Admin audit trail stored as `adminActivity` documents; only the newest MAX_ENTRIES are kept. */

export const MAX_ENTRIES = 1000;

export const ACTIONS = ['create', 'edit', 'hide', 'show', 'delete', 'price', 'import', 'settings'] as const;
export type ActivityAction = (typeof ACTIONS)[number];
export type EntityType = 'menu' | 'branch' | 'offer' | 'import' | 'settings';

export interface ActivityInput {
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  label: string;
  detail?: string;
}

export interface ActivityEntry {
  _id: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: string | null;
  label: string;
  detail: string | null;
  at: string;
}

/** Never throws: a failed log must not undo or block the change that was already made. */
export async function logActivity(...entries: ActivityInput[]): Promise<void> {
  const c = writeClient();
  if (!c || entries.length === 0) return;
  try {
    const at = new Date().toISOString();
    const tx = c.transaction();
    for (const e of entries) {
      tx.create({
        _id: `activity-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`,
        _type: 'adminActivity',
        action: e.action,
        entityType: e.entityType,
        ...(e.entityId ? { entityId: e.entityId } : {}),
        label: e.label.slice(0, 200),
        ...(e.detail ? { detail: e.detail.slice(0, 1000) } : {}),
        at,
      });
    }
    await tx.commit();
    await prune(c);
  } catch (err) {
    console.error('[admin/activity] could not log', err instanceof Error ? err.message : err);
  }
}

async function prune(c: NonNullable<ReturnType<typeof writeClient>>): Promise<void> {
  const total = await c.fetch<number>(`count(*[_type == "adminActivity"])`);
  if (total <= MAX_ENTRIES) return;
  const extra = await c.fetch<string[]>(`*[_type == "adminActivity"] | order(at desc, _id desc)[${MAX_ENTRIES}...${MAX_ENTRIES + 500}]._id`);
  if (extra.length === 0) return;
  const tx = c.transaction();
  for (const id of extra) tx.delete(id);
  await tx.commit();
}

export interface ActivityFilter {
  action?: string;
  /** YYYY-MM-DD, interpreted in Asia/Dubai. */
  from?: string;
  to?: string;
  limit?: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function listActivity(f: ActivityFilter = {}): Promise<{ entries: ActivityEntry[]; total: number }> {
  const c = readClient();
  if (!c) return { entries: [], total: 0 };
  const conds = ['_type == "adminActivity"'];
  const params: Record<string, string> = {};
  if (f.action && (ACTIONS as readonly string[]).includes(f.action)) { conds.push('action == $action'); params['action'] = f.action; }
  if (f.from && DATE.test(f.from)) { conds.push('at >= $from'); params['from'] = new Date(`${f.from}T00:00:00+04:00`).toISOString(); }
  if (f.to && DATE.test(f.to)) { conds.push('at < $to'); params['to'] = new Date(new Date(`${f.to}T00:00:00+04:00`).getTime() + 86_400_000).toISOString(); }
  const where = conds.join(' && ');
  const limit = Math.min(Math.max(f.limit ?? 200, 1), MAX_ENTRIES);
  try {
    return await c.fetch(
      `{"entries": *[${where}] | order(at desc, _id desc)[0...${limit}]{_id, action, entityType, "entityId": coalesce(entityId, null), label, "detail": coalesce(detail, null), at},
        "total": count(*[${where}])}`,
      params,
    );
  } catch (err) {
    console.error('[admin/activity] list failed', err instanceof Error ? err.message : err);
    return { entries: [], total: 0 };
  }
}
