import { Request, Response } from "express";
import { createCategorySchema, updateCategorySchema, patchCategorySchema } from "@/dtos/category.dto";
import * as categoryService from "@/services/category.service";

/**
 * GET / — Récupère toutes les catégories.
 */
export async function getAll(req: Request, res: Response): Promise<void> {
  try {
    const categories = await categoryService.getAllCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
}

/**
 * GET /:id — Récupère une catégorie par ID.
 */
export async function getById(req: Request, res: Response): Promise<void> {
  try {
    const category = await categoryService.getCategoryById(Number(req.params.id));
    if (!category) {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
}

/**
 * POST / — Crée une nouvelle catégorie.
 */
export async function create(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Données invalides", errors: parsed.error.issues });
      return;
    }

    const category = await categoryService.createCategory(parsed.data);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
}

/**
 * PUT /:id — Remplace entièrement une catégorie.
 */
export async function update(req: Request, res: Response): Promise<void> {
  try {
    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Données invalides", errors: parsed.error.issues });
      return;
    }

    const category = await categoryService.updateCategory(Number(req.params.id), parsed.data);
    res.json(category);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.status(500).json({ message: "Erreur serveur", error });
  }
}

/**
 * PATCH /:id — Modifie partiellement une catégorie.
 */
export async function patch(req: Request, res: Response): Promise<void> {
  try {
    const parsed = patchCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Données invalides", errors: parsed.error.issues });
      return;
    }

    if (Object.keys(parsed.data).length === 0) {
      res.status(400).json({ message: "Aucun champ à modifier" });
      return;
    }

    const category = await categoryService.patchCategory(Number(req.params.id), parsed.data);
    res.json(category);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.status(500).json({ message: "Erreur serveur", error });
  }
}

/**
 * DELETE /:id — Supprime une catégorie.
 */
export async function remove(req: Request, res: Response): Promise<void> {
  try {
    await categoryService.deleteCategory(Number(req.params.id));
    res.status(204).send();
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Category not found" });
      return;
    }
    res.status(500).json({ message: "Erreur serveur", error });
  }
}