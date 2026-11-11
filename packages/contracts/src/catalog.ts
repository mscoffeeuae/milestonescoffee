import { z } from 'zod';
import { BilingualStringSchema, FilsSchema, UuidSchema } from './common.js';

export const BranchSchema = z.object({
  id: UuidSchema,
  slug: z.string(),
  name: BilingualStringSchema,
  address: BilingualStringSchema,
  phone: z.string().optional(),
  isActive: z.boolean(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});
export type Branch = z.infer<typeof BranchSchema>;

export const ProductVariantSchema = z.object({
  id: UuidSchema,
  sku: z.string(),
  name: BilingualStringSchema,
  priceFils: FilsSchema,
  isAvailable: z.boolean(),
});
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

export const ModifierOptionSchema = z.object({
  id: UuidSchema,
  name: BilingualStringSchema,
  priceDeltaFils: FilsSchema,
  isAvailable: z.boolean(),
});
export type ModifierOption = z.infer<typeof ModifierOptionSchema>;

export const ModifierGroupSchema = z.object({
  id: UuidSchema,
  name: BilingualStringSchema,
  isRequired: z.boolean(),
  minSelections: z.number().int().nonnegative(),
  maxSelections: z.number().int().positive(),
  options: z.array(ModifierOptionSchema),
});
export type ModifierGroup = z.infer<typeof ModifierGroupSchema>;

export const ProductSchema = z.object({
  id: UuidSchema,
  slug: z.string(),
  name: BilingualStringSchema,
  description: BilingualStringSchema.optional(),
  categoryId: UuidSchema,
  variants: z.array(ProductVariantSchema),
  modifierGroups: z.array(ModifierGroupSchema),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean(),
});
export type Product = z.infer<typeof ProductSchema>;
