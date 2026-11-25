import { defineType, defineField } from 'sanity';

/**
 * Menu product — an item shown on the public menu page.
 *
 * CMS prices are DISPLAY-ONLY (shown as "from X AED").
 * Actual transactional pricing lives exclusively in apps/api.
 * Allergens are [PLACEHOLDER] — must be verified by Operations before publish.
 */
export const menuProduct = defineType({
  name: 'menuProduct',
  title: 'Menu Product',
  type: 'document',
  fields: [
    defineField({
      name: 'nameEn',
      title: 'Product name (English)',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(100),
    }),
    defineField({
      name: 'nameAr',
      title: 'Product name (Arabic) [PLACEHOLDER]',
      type: 'string',
      description: '⚠ Requires native speaker approval.',
      validation: (rule) => rule.required().min(2).max(100),
    }),
    defineField({
      name: 'slug',
      title: 'URL slug',
      type: 'slug',
      options: { source: 'nameEn', maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'menuCategory' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'descriptionEn',
      title: 'Description (English)',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(400),
    }),
    defineField({
      name: 'descriptionAr',
      title: 'Description (Arabic) [PLACEHOLDER]',
      type: 'text',
      rows: 3,
      description: '⚠ Requires native speaker approval.',
      validation: (rule) => rule.max(400),
    }),

    // ── Pricing (display only) ────────────────────────────────────────────
    defineField({
      name: 'displayPriceAed',
      title: 'Display price (AED) [PLACEHOLDER]',
      type: 'number',
      description:
        '⚠ DISPLAY ONLY — shown as "from X AED". Transactional price is in apps/api catalog. ' +
        'Must be approved by Operations and Finance. Use whole numbers (fils precision not needed here).',
      validation: (rule) => rule.min(0).max(10000),
    }),

    // ── Allergens ────────────────────────────────────────────────────────
    defineField({
      name: 'allergens',
      title: 'Allergens [PLACEHOLDER — must be verified by Operations]',
      type: 'array',
      description:
        '⚠ PLACEHOLDER. Must be verified against actual recipe by Operations before ANY publish. ' +
        'Incorrect allergen data is a serious food-safety risk.',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Milk / Dairy', value: 'dairy' },
          { title: 'Gluten / Wheat', value: 'gluten' },
          { title: 'Eggs', value: 'eggs' },
          { title: 'Tree Nuts', value: 'tree-nuts' },
          { title: 'Peanuts', value: 'peanuts' },
          { title: 'Soy', value: 'soy' },
          { title: 'Sesame', value: 'sesame' },
          { title: 'Fish', value: 'fish' },
          { title: 'Shellfish', value: 'shellfish' },
          { title: 'Sulphites', value: 'sulphites' },
        ],
        layout: 'grid',
      },
    }),

    // ── Dietary flags ────────────────────────────────────────────────────
    defineField({
      name: 'dietaryFlags',
      title: 'Dietary flags [PLACEHOLDER — must be verified by Operations]',
      type: 'array',
      description: '⚠ Must be verified against actual recipe.',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Vegan', value: 'vegan' },
          { title: 'Vegetarian', value: 'vegetarian' },
          { title: 'Halal certified', value: 'halal' },
          { title: 'Gluten-free', value: 'gluten-free' },
          { title: 'Sugar-free', value: 'sugar-free' },
          { title: 'Dairy-free', value: 'dairy-free' },
        ],
        layout: 'grid',
      },
    }),

    // ── Availability ─────────────────────────────────────────────────────
    defineField({
      name: 'isActive',
      title: 'Active (visible on menu)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isNew',
      title: 'Mark as "New"',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured (highlight on homepage)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort order within category',
      type: 'number',
      description: 'Lower numbers appear first.',
      initialValue: 100,
      validation: (rule) => rule.integer().min(0),
    }),

    // ── Media ─────────────────────────────────────────────────────────────
    defineField({
      name: 'productImage',
      title: 'Product image',
      type: 'image',
      description: 'Main product photo. Must be approved brand imagery. Square crop recommended. Web-admin uploads are resized and converted to WebP automatically.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'productImageThumb',
      title: 'Product image thumbnail (600px)',
      type: 'image',
      description: 'Generated by the web admin when an image is uploaded. Used on lists and small cards.',
      readOnly: true,
    }),
    defineField({
      name: 'productImageAvif',
      title: 'Product image AVIF',
      type: 'file',
      description: 'Generated only when the AVIF is smaller than the WebP.',
      readOnly: true,
    }),
    defineField({ name: 'imageMeta', title: 'Image optimisation details', type: 'imageOptimisation' }),

    // ── SEO ───────────────────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: 'SEO metadata',
      type: 'seoMetadata',
    }),
  ],

  orderings: [
    {
      title: 'Category, then sort order',
      name: 'categorySortOrder',
      by: [
        { field: 'category.nameEn', direction: 'asc' },
        { field: 'sortOrder', direction: 'asc' },
      ],
    },
  ],

  preview: {
    select: {
      title: 'nameEn',
      subtitle: 'category.nameEn',
      media: 'productImage',
      active: 'isActive',
    },
    prepare({ title, subtitle, media, active }) {
      return {
        title: `${active ? '' : '⚠ INACTIVE — '}${title ?? 'Unnamed product'}`,
        subtitle: subtitle ?? 'No category',
        media,
      };
    },
  },
});
