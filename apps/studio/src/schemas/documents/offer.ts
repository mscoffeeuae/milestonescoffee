import { defineType, defineField } from 'sanity';

/**
 * Offer / promotion page — editorial content only (Phase 1).
 *
 * This document controls the PUBLIC-FACING description of a promotion.
 * It has NO connection to discount logic, coupon codes or pricing rules.
 * Those are managed in apps/api (Phase 2+).
 *
 * Terms and conditions MUST be reviewed by Legal before publish.
 */
export const offer = defineType({
  name: 'offer',
  title: 'Offer / Promotion',
  type: 'document',
  fields: [
    defineField({
      name: 'titleEn',
      title: 'Offer title (English)',
      type: 'string',
      description: 'Headline shown on the offers listing and card.',
      validation: (rule) => rule.required().min(5).max(100),
    }),
    defineField({
      name: 'titleAr',
      title: 'Offer title (Arabic) [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Requires native speaker approval.',
      validation: (rule) => rule.required().min(5).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: { source: 'titleEn', maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summaryEn',
      title: 'Summary (English)',
      type: 'text',
      rows: 2,
      description: 'Short teaser shown on listing cards. 160 chars max.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'summaryAr',
      title: 'Summary (Arabic) [PLACEHOLDER]',
      type: 'text',
      rows: 2,
      description: '⚠ Requires native speaker approval.',
      validation: (rule) => rule.max(160),
    }),
    defineField({
      name: 'bodyEn',
      title: 'Full description (English)',
      type: 'array',
      description: 'Rich text body of the offer detail page.',
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
      title: 'Full description (Arabic) [PLACEHOLDER]',
      type: 'array',
      description: '⚠ Requires native speaker approval.',
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

    // ── Validity ──────────────────────────────────────────────────────────
    defineField({
      name: 'validFrom',
      title: 'Valid from',
      type: 'datetime',
      description: 'UTC datetime when this offer becomes visible.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'validUntil',
      title: 'Valid until',
      type: 'datetime',
      description: 'UTC datetime when this offer expires. Leave empty for open-ended.',
    }),
    defineField({
      name: 'isActive',
      title: 'Active (visible on website)',
      type: 'boolean',
      description: 'Set true only after Legal has reviewed the terms.',
      initialValue: false,
    }),

    // ── Terms ─────────────────────────────────────────────────────────────
    defineField({
      name: 'termsEn',
      title: 'Terms & conditions (English) [PLACEHOLDER — requires Legal review]',
      type: 'text',
      rows: 4,
      description: '⚠ Must be reviewed and approved by Legal before publish.',
    }),
    defineField({
      name: 'termsAr',
      title: 'Terms & conditions (Arabic) [PLACEHOLDER — requires Legal + native speaker review]',
      type: 'text',
      rows: 4,
      description: '⚠ Must be reviewed by Legal AND a native Arabic speaker before publish.',
    }),

    // ── Branch targeting ─────────────────────────────────────────────────
    defineField({
      name: 'applicableBranches',
      title: 'Applicable branches (empty = all branches)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'branch' }] }],
      description: 'Leave empty if the offer applies to all branches.',
    }),

    // ── Media ─────────────────────────────────────────────────────────────
    defineField({
      name: 'heroImage',
      title: 'Offer hero image',
      type: 'image',
      description: 'Banner image for the offer. Must be approved brand imagery.',
      options: { hotspot: true },
    }),

    // ── SEO ───────────────────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO metadata',
      type: 'seoMetadata',
    }),
  ],

  orderings: [
    {
      title: 'Valid from (newest first)',
      name: 'validFromDesc',
      by: [{ field: 'validFrom', direction: 'desc' }],
    },
  ],

  preview: {
    select: {
      title: 'titleEn',
      subtitle: 'validFrom',
      media: 'heroImage',
      active: 'isActive',
    },
    prepare({ title, subtitle, media, active }) {
      const date = subtitle ? new Date(subtitle as string).toLocaleDateString('en-AE') : 'No date';
      return {
        title: `${active ? '' : '⚠ INACTIVE — '}${title ?? 'Unnamed offer'}`,
        subtitle: `From: ${date}`,
        media,
      };
    },
  },
});
