import { defineType, defineField } from 'sanity';

/**
 * Written by the web admin when an image is optimised on upload (apps/web image-optimise.ts).
 * Read-only in the Studio: it records dimensions and sizes (bytes) of the stored outputs.
 */
export const imageOptimisation = defineType({
  name: 'imageOptimisation',
  title: 'Image optimisation',
  type: 'object',
  readOnly: true,
  fields: [
    defineField({ name: 'width', type: 'number', title: 'Width (px)' }),
    defineField({ name: 'height', type: 'number', title: 'Height (px)' }),
    defineField({ name: 'thumbWidth', type: 'number', title: 'Thumbnail width (px)' }),
    defineField({ name: 'thumbHeight', type: 'number', title: 'Thumbnail height (px)' }),
    defineField({ name: 'originalBytes', type: 'number', title: 'Original size (bytes)' }),
    defineField({ name: 'fullBytes', type: 'number', title: 'Full image size (bytes)' }),
    defineField({ name: 'thumbBytes', type: 'number', title: 'Thumbnail size (bytes)' }),
    defineField({ name: 'avifBytes', type: 'number', title: 'AVIF size (bytes, only when smaller than WebP)' }),
    defineField({ name: 'keptOriginal', type: 'boolean', title: 'Original kept (was smaller than optimised)' }),
    defineField({ name: 'originalFilename', type: 'string', title: 'Original file name' }),
    defineField({ name: 'optimisedAt', type: 'datetime', title: 'Optimised at' }),
  ],
});
