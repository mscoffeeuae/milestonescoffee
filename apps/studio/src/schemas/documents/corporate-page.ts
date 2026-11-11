import { defineType, defineField } from 'sanity';

/**
 * Corporate enquiry landing page — editorial content.
 *
 * This document controls the content of /corporate.
 * It is a singleton: only one document of this type should exist.
 * Form submission handling is in apps/api (Phase 2+).
 * Copy and service descriptions are [PLACEHOLDER] until Marketing approves.
 */
export const corporatePage = defineType({
  name: 'corporatePage',
  title: 'Corporate Page',
  type: 'document',
  // Singleton pattern: only 'update' and 'publish' — prevent new document creation
  // Note: Sanity removed __experimental_actions. Enforce singleton via structure config in sanity.config.ts.

  fields: [
    // ── Hero ─────────────────────────────────────────────────────────────
    defineField({
      name: 'heroTitleEn',
      title: 'Hero title (English) [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Requires Marketing approval.',
      validation: (rule) => rule.required().min(5).max(120),
    }),
    defineField({
      name: 'heroTitleAr',
      title: 'Hero title (Arabic) [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Requires native speaker + Marketing approval.',
      validation: (rule) => rule.required().min(5).max(120),
    }),
    defineField({
      name: 'heroSubtitleEn',
      title: 'Hero subtitle (English) [PLACEHOLDER]',
      type: 'text',
      rows: 2,
      description: '⚠ Requires Marketing approval.',
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'heroSubtitleAr',
      title: 'Hero subtitle (Arabic) [PLACEHOLDER]',
      type: 'text',
      rows: 2,
      description: '⚠ Requires native speaker + Marketing approval.',
      validation: (rule) => rule.max(300),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      description: 'Must be approved brand imagery. 1600×900px recommended.',
      options: { hotspot: true },
    }),

    // ── Services list ────────────────────────────────────────────────────
    defineField({
      name: 'serviceCards',
      title: 'Service cards [PLACEHOLDER — requires Marketing approval]',
      type: 'array',
      description: '⚠ Each card copy requires Marketing approval before publish.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'titleEn', title: 'Title (English)', type: 'string', validation: (rule) => rule.required().max(60) }),
            defineField({ name: 'titleAr', title: 'Title (Arabic) [PLACEHOLDER]', type: 'string', description: '⚠ Requires approval.' }),
            defineField({ name: 'descriptionEn', title: 'Description (English)', type: 'text', rows: 2, validation: (rule) => rule.max(200) }),
            defineField({ name: 'descriptionAr', title: 'Description (Arabic) [PLACEHOLDER]', type: 'text', rows: 2, description: '⚠ Requires approval.' }),
            defineField({ name: 'icon', title: 'Icon name', type: 'string', description: 'Icon identifier from the design system (e.g. "coffee", "gift", "calendar").' }),
          ],
          preview: {
            select: { title: 'titleEn', subtitle: 'descriptionEn' },
          },
        },
      ],
      validation: (rule) => rule.max(8),
    }),

    // ── Body content ─────────────────────────────────────────────────────
    defineField({
      name: 'bodyEn',
      title: 'Body content (English) [PLACEHOLDER]',
      type: 'array',
      description: '⚠ Requires Marketing approval.',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'bodyAr',
      title: 'Body content (Arabic) [PLACEHOLDER]',
      type: 'array',
      description: '⚠ Requires native speaker + Marketing approval.',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
          },
        },
      ],
    }),

    // ── CTA ───────────────────────────────────────────────────────────────
    defineField({
      name: 'ctaLabelEn',
      title: 'CTA button label (English) [PLACEHOLDER]',
      type: 'string',
      description: 'e.g. "Send enquiry". Requires Marketing approval.',
      validation: (rule) => rule.max(40),
    }),
    defineField({
      name: 'ctaLabelAr',
      title: 'CTA button label (Arabic) [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Requires native speaker + Marketing approval.',
      validation: (rule) => rule.max(40),
    }),

    // ── Contact ───────────────────────────────────────────────────────────
    defineField({
      name: 'enquiryEmail',
      title: 'Enquiry email address [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Must be confirmed by Operations. Used as fallback contact.',
    }),

    // ── SEO ───────────────────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO metadata',
      type: 'seoMetadata',
    }),
  ],

  preview: {
    prepare() {
      return { title: 'Corporate Enquiry Page (singleton)' };
    },
  },
});
