import { defineType, defineField } from 'sanity';

/**
 * Menu category — groups products (e.g. "Hot Drinks", "Cold Beverages").
 *
 * Display-only. Transactional catalog lives in apps/api.
 * Names are [PLACEHOLDER] until Operations and Marketing supply approved copy.
 */
export const menuCategory = defineType({
  name: 'menuCategory',
  title: 'Menu Category',
  type: 'document',
  fields: [
    defineField({
      name: 'nameEn',
      title: 'Category name (English)',
      type: 'string',
      description: 'Displayed as section heading on the menu page.',
      validation: (rule) => rule.required().min(2).max(60),
    }),
    defineField({
      name: 'nameAr',
      title: 'Category name (Arabic) [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Requires native speaker approval before publish.',
      validation: (rule) => rule.required().min(2).max(60),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug / anchor',
      type: 'slug',
      description: 'Used as page anchor on /menu. Changing breaks existing deep-links.',
      options: { source: 'nameEn', maxLength: 40 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'descriptionEn',
      title: 'Short description (English)',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'descriptionAr',
      title: 'Short description (Arabic) [PLACEHOLDER]',
      type: 'text',
      rows: 2,
      description: '⚠ Requires native speaker approval.',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort order',
      type: 'number',
      description: 'Lower numbers appear first. Use increments of 10 to leave room.',
      initialValue: 100,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'isActive',
      title: 'Active (visible on website)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'coverImage',
      title: 'Category image',
      type: 'image',
      description: 'Optional banner for this category. Must be approved brand imagery.',
      options: { hotspot: true },
    }),
  ],

  orderings: [
    {
      title: 'Sort order',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],

  preview: {
    select: {
      title: 'nameEn',
      subtitle: 'sortOrder',
      media: 'coverImage',
      active: 'isActive',
    },
    prepare({ title, subtitle, media, active }) {
      return {
        title: `${active ? '' : '⚠ INACTIVE — '}${title ?? 'Unnamed category'}`,
        subtitle: `Sort: ${subtitle ?? '—'}`,
        media,
      };
    },
  },
});
