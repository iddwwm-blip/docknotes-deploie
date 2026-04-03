import { describe, it, expect, vi, beforeEach } from "vitest";
import * as categoryService from "@/services/category.service";

/**
 * Mock du client Prisma pour la table "category".
 * Chaque méthode Prisma est remplacée par vi.fn() pour contrôler son comportement.
 */
vi.mock("@/lib/db", () => {
  return {
    default: {
      category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

import db from "@/lib/db";

// Cast pour accéder aux méthodes de mock
const mockDb = db as unknown as {
  category: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS : Récupérer toutes les catégories ====================
describe("categoryService.getAllCategories", () => {
  it("retourne toutes les categories", async () => {
    const fakeCategories = [
      { id: 1, name: "Work", description: null },
      { id: 2, name: "Personal", description: "Mes notes perso" },
    ];
    mockDb.category.findMany.mockResolvedValue(fakeCategories);

    const result = await categoryService.getAllCategories();

    // Vérifie que findMany a bien été appelé (sans filtre = toutes les catégories)
    expect(mockDb.category.findMany).toHaveBeenCalled();
    expect(result).toEqual(fakeCategories);
  });
});

// ==================== TESTS : Récupérer une catégorie par ID ====================
describe("categoryService.getCategoryById", () => {
  it("retourne la categorie si elle existe", async () => {
    const fakeCategory = { id: 1, name: "Work", description: null };
    mockDb.category.findUnique.mockResolvedValue(fakeCategory);

    const result = await categoryService.getCategoryById(1);

    // Vérifie que Prisma cherche bien par ID
    expect(mockDb.category.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual(fakeCategory);
  });

  it("retourne null si la categorie n'existe pas", async () => {
    mockDb.category.findUnique.mockResolvedValue(null);

    const result = await categoryService.getCategoryById(999);

    expect(result).toBeNull();
  });
});

// ==================== TESTS : Créer une catégorie ====================
describe("categoryService.createCategory", () => {
  it("cree une categorie avec description", async () => {
    const created = { id: 1, name: "Work", description: "Boulot" };
    mockDb.category.create.mockResolvedValue(created);

    const result = await categoryService.createCategory({
      name: "Work",
      description: "Boulot",
    });

    // Vérifie les données envoyées à Prisma pour la création
    expect(mockDb.category.create).toHaveBeenCalledWith({
      data: { name: "Work", description: "Boulot" },
    });
    expect(result).toEqual(created);
  });

  // Test : La description est mise à null par défaut si non fournie
  it("cree une categorie sans description (null par defaut)", async () => {
    const created = { id: 2, name: "Ideas", description: null };
    mockDb.category.create.mockResolvedValue(created);

    const result = await categoryService.createCategory({ name: "Ideas" });

    expect(mockDb.category.create).toHaveBeenCalledWith({
      data: { name: "Ideas", description: null },
    });
    expect(result).toEqual(created);
  });
});

// ==================== TESTS : Mise à jour complète (PUT) ====================
describe("categoryService.updateCategory", () => {
  // PUT remplace TOUTES les données (même celles non envoyées reviennent à null)
  it("remplace entierement une categorie", async () => {
    const updated = { id: 1, name: "Updated", description: null };
    mockDb.category.update.mockResolvedValue(updated);

    const result = await categoryService.updateCategory(1, {
      name: "Updated",
    });

    // description est forcé à null car c'est un PUT (remplacement complet)
    expect(mockDb.category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "Updated", description: null },
    });
    expect(result).toEqual(updated);
  });
});

// ==================== TESTS : Modification partielle (PATCH) ====================
describe("categoryService.patchCategory", () => {
  // PATCH ne modifie que les champs envoyés, sans toucher aux autres
  it("modifie partiellement une categorie", async () => {
    const patched = { id: 1, name: "Patched", description: "Desc" };
    mockDb.category.update.mockResolvedValue(patched);

    const result = await categoryService.patchCategory(1, { name: "Patched" });

    // Seul "name" est dans data (description n'est pas touchée)
    expect(mockDb.category.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "Patched" },
    });
    expect(result).toEqual(patched);
  });
});

// ==================== TESTS : Supprimer une catégorie ====================
describe("categoryService.deleteCategory", () => {
  it("supprime la categorie et retourne true", async () => {
    mockDb.category.delete.mockResolvedValue({});

    const result = await categoryService.deleteCategory(1);

    expect(mockDb.category.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBe(true);
  });
});
