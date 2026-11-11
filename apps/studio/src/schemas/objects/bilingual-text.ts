import { defineType, defineField } from 'sanity';

/**
 * Reusable bilingual string object — English + Arabic.
 * Arabic content is [PLACEHOLDER] until Marketing provides approved copy.
 */
export const bilingualText = defineType({
  name: 'bilingualText',
  title: 'Bilingual Text',
  type: 'object',
  fields: [
    defineField({
      name: 'en',
      title: 'English',
      type: 'string',
      validation: (rule) => rule.required().min(1).max(200),
    }),
    defineField({
      name: 'ar',
      title: 'Arabic [PLACEHOLDER — requires native speaker approval]',
      type: 'string',
      description: '⚠ Must be reviewed and approved by a native Arabic speaker before publish.',
      validation: (rule) => rule.required().min(1).max(200),
    }),
  ],
  preview: {
    select: { title: 'en', subtitle: 'ar' },
  },
});
