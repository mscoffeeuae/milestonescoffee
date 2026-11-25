import { defineType, defineField } from 'sanity';

/**
 * Branch document — one document per physical café location.
 *
 * IMPORTANT: Addresses, coordinates and service lists are [PLACEHOLDER].
 * Operations must supply verified data before publish.
 * CMS branch data is for DISPLAY only — transactional pricing lives in
 * the backend catalog (apps/api), never in Sanity.
 */
export const branch = defineType({
  name: 'branch',
  title: 'Branch',
  type: 'document',
  fields: [
    defineField({
      name: 'nameEn',
      title: 'Branch name (English)',
      type: 'string',
      description: 'Displayed in navigation and location pages.',
      validation: (rule) => rule.required().min(2).max(80),
    }),
    defineField({
      name: 'nameAr',
      title: 'Branch name (Arabic) [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Requires native speaker approval before publish.',
      validation: (rule) => rule.required().min(2).max(80),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      description: 'Used in /locations/[slug]. Changing this after launch breaks existing links.',
      options: { source: 'nameEn', maxLength: 60 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Active (visible on website)',
      type: 'boolean',
      description: 'Set false to hide from public listing without deleting.',
      initialValue: false,
    }),

    // ── Location ─────────────────────────────────────────────────────────
    defineField({
      name: 'addressEn',
      title: 'Address (English) [PLACEHOLDER]',
      type: 'text',
      rows: 3,
      description: '⚠ Must be verified by Operations before publish.',
    }),
    defineField({
      name: 'addressAr',
      title: 'Address (Arabic) [PLACEHOLDER]',
      type: 'text',
      rows: 3,
      description: '⚠ Requires native speaker approval and Operations verification.',
    }),
    defineField({
      name: 'emirate',
      title: 'Emirate',
      type: 'string',
      options: {
        list: [
          { title: 'Abu Dhabi', value: 'abu-dhabi' },
          { title: 'Dubai', value: 'dubai' },
          { title: 'Sharjah', value: 'sharjah' },
          { title: 'Ajman', value: 'ajman' },
          { title: 'Umm Al Quwain', value: 'umm-al-quwain' },
          { title: 'Ras Al Khaimah', value: 'ras-al-khaimah' },
          { title: 'Fujairah', value: 'fujairah' },
        ],
        layout: 'dropdown',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'googleMapsUrl',
      title: 'Google Maps URL [PLACEHOLDER]',
      type: 'url',
      description: '⚠ Must be verified by Operations. Used for "Get directions" link.',
    }),
    defineField({
      name: 'coordinates',
      title: 'Coordinates [PLACEHOLDER]',
      type: 'object',
      description: '⚠ Must be verified by Operations. Used for map pin.',
      fields: [
        defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
        defineField({ name: 'lng', title: 'Longitude', type: 'number' }),
      ],
    }),

    // ── Hours ─────────────────────────────────────────────────────────────
    defineField({
      name: 'openingHours',
      title: 'Opening hours',
      type: 'openingHours',
      description: 'Times in Asia/Dubai local time (HH:MM). Verified by Operations.',
    }),
    defineField({
      name: 'openingHoursNoteEn',
      title: 'Opening hours note (English)',
      type: 'string',
      description: 'e.g. "Ramadan hours may vary." 100 chars max.',
      validation: (rule) => rule.max(100),
    }),
    defineField({
      name: 'openingHoursNoteAr',
      title: 'Opening hours note (Arabic) [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Requires native speaker approval.',
      validation: (rule) => rule.max(100),
    }),

    // ── Services ──────────────────────────────────────────────────────────
    defineField({
      name: 'services',
      title: 'Available services [PLACEHOLDER]',
      type: 'array',
      description: '⚠ Must be verified by Operations. Controls service icons on location page.',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Dine in', value: 'dine-in' },
          { title: 'Takeaway', value: 'takeaway' },
          { title: 'Drive-through', value: 'drive-through' },
          { title: 'Delivery', value: 'delivery' },
          { title: 'WiFi', value: 'wifi' },
          { title: 'Prayer room', value: 'prayer-room' },
          { title: 'Parking', value: 'parking' },
          { title: 'Accessible', value: 'accessible' },
        ],
        layout: 'grid',
      },
    }),

    // ── Media ─────────────────────────────────────────────────────────────
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      description: 'Main photo for the branch page. Must be approved brand imagery. 1200×800px minimum.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'galleryImages',
      title: 'Gallery images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            // Written by the web admin on upload (resized, WebP); safe to leave empty for Studio uploads.
            defineField({ name: 'thumb', type: 'image', title: 'Thumbnail (600px)', readOnly: true }),
            defineField({ name: 'avif', type: 'file', title: 'AVIF', readOnly: true }),
            defineField({ name: 'imageMeta', type: 'imageOptimisation', title: 'Image optimisation details' }),
          ],
        },
      ],
      validation: (rule) => rule.max(10),
    }),

    // ── SEO ───────────────────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO metadata',
      type: 'seoMetadata',
    }),

    // ── Phone ─────────────────────────────────────────────────────────────
    defineField({
      name: 'phone',
      title: 'Phone number [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Must be verified by Operations. Include country code e.g. +971 4 123 4567.',
    }),
    defineField({
      name: 'whatsapp',
      title: 'WhatsApp number [PLACEHOLDER]',
      type: 'string',
      description: 'Leave empty to hide the WhatsApp button. Include country code e.g. +971 50 123 4567.',
    }),
  ],

  orderings: [
    {
      title: 'Emirate, then name',
      name: 'emirateNameAsc',
      by: [
        { field: 'emirate', direction: 'asc' },
        { field: 'nameEn', direction: 'asc' },
      ],
    },
  ],

  preview: {
    select: {
      title: 'nameEn',
      subtitle: 'emirate',
      media: 'heroImage',
      active: 'isActive',
    },
    prepare({ title, subtitle, media, active }) {
      return {
        title: `${active ? '' : '⚠ INACTIVE — '}${title ?? 'Unnamed branch'}`,
        subtitle: subtitle ?? '',
        media,
      };
    },
  },
});
