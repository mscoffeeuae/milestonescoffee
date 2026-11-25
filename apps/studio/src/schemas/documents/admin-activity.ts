import { defineType, defineField } from 'sanity';

/**
 * Audit trail written by the web admin (apps/web /admin/activity). Read-only here:
 * one document per create / edit / hide / show / delete / import / settings change.
 * The admin keeps only the newest 1,000 entries.
 */
export const adminActivity = defineType({
  name: 'adminActivity',
  title: 'Admin activity',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({
      name: 'action',
      type: 'string',
      options: { list: ['create', 'edit', 'hide', 'show', 'delete', 'price', 'import', 'settings'] },
    }),
    defineField({ name: 'entityType', type: 'string', title: 'Item type', options: { list: ['menu', 'branch', 'offer', 'import', 'settings'] } }),
    defineField({ name: 'entityId', type: 'string', title: 'Item id' }),
    defineField({ name: 'label', type: 'string', title: 'Item name' }),
    defineField({ name: 'detail', type: 'text', rows: 3 }),
    defineField({ name: 'at', type: 'datetime', title: 'When (UTC)' }),
  ],
  orderings: [{ title: 'Newest first', name: 'atDesc', by: [{ field: 'at', direction: 'desc' }] }],
  preview: {
    select: { title: 'label', action: 'action', at: 'at' },
    prepare: ({ title, action, at }) => ({ title: `${action ?? '?'} · ${title ?? ''}`, subtitle: at }),
  },
});
