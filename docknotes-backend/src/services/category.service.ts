import db from "@/lib/db";
import type { CreateCategoryDto, UpdateCategoryDto, PatchCategoryDto } from "@/dtos/category.dto";

/**
 * Récupère toutes les catégories.
 */
export async function getAllCategories() {
  return db.category.findMany();
}

/**
 * Récupère une catégorie par ID.
 */
export async function getCategoryById(id: number) {
  return db.category.findUnique({ where: { id } });
}

/**
 * Crée une nouvelle catégorie.
 */
export async function createCategory(data: CreateCategoryDto) {
  return db.category.create({
    data: {
      name: data.name,
      description: data.description ?? null,
    },
  });
}

/**
 * Remplace entièrement une catégorie (PUT).
 */
export async function updateCategory(id: number, data: UpdateCategoryDto) {
  return db.category.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description ?? null,
    },
  });
}

/**
 * Modifie partiellement une catégorie (PATCH).
 */
export async function patchCategory(id: number, data: PatchCategoryDto) {
  return db.category.update({
    where: { id },
    data,
  });
}

/**
 * Supprime une catégorie.
 */
export async function deleteCategory(id: number) {
  await db.category.delete({ where: { id } });
  return true;
}
