import { defineType, defineField } from 'sanity';

/**
 * SEO metadata object — reused by all public document types.
 * Title, description and OG image for each locale.
 */
export const seoMetadata = defineType({
  name: 'seoMetadata',
  title: 'SEO Metadata',
  type: 'object',
  fields: [
    defineField({
      name: 'titleEn',
      title: 'Page title (English)',
      type: 'string',
      description: 'Appears in browser tab and search results. 50–60 characters ideal.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'titleAr',
      title: 'Page title (Arabic) [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Requires native speaker approval. 50–60 characters ideal.',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'descriptionEn',
      title: 'Meta description (English)',
      type: 'text',
      rows: 2,
      description: '120–160 characters for best search display.',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'descriptionAr',
      title: 'Meta description (Arabic) [PLACEHOLDER]',
      type: 'text',
      rows: 2,
      description: '⚠ Requires native speaker approval.',
      validation: (rule) => rule.max(200),
    }),
    defineField({
      name: 'ogImage',
      title: 'Open Graph image',
      type: 'image',
      description: 'Shared preview image. 1200×630px recommended. Must be approved brand imagery.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'noIndex',
      title: 'Exclude from search engines (noindex)',
      type: 'boolean',
      description: 'Set true for draft or private pages.',
      initialValue: false,
    }),
  ],
});
