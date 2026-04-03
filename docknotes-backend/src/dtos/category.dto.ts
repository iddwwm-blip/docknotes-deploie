import { z } from "zod/v4";

/**
 * DTO pour la création d'une catégorie (POST).
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(50),
  description: z.string().max(255).nullable().optional(),
});

/**
 * DTO pour le remplacement complet d'une catégorie (PUT).
 */
export const updateCategorySchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(50),
  description: z.string().max(255).nullable().optional(),
});

/**
 * DTO pour la modification partielle d'une catégorie (PATCH).
 */
export const patchCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(255).nullable().optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type PatchCategoryDto = z.infer<typeof patchCategorySchema>;
