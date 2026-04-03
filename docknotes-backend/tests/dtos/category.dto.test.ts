import { describe, it, expect } from "vitest";

// On importe les 3 schémas de validation Zod pour les catégories :
// - createCategorySchema : règles pour créer une catégorie
// - updateCategorySchema : règles pour remplacer entièrement une catégorie (PUT)
// - patchCategorySchema : règles pour modifier partiellement une catégorie (PATCH)
import { createCategorySchema, updateCategorySchema, patchCategorySchema } from "@/dtos/category.dto";

// ==================== TESTS : Schéma de création ====================
describe("createCategorySchema", () => {
  // safeParse() teste les données sans lancer d'exception
  it("valide un nom valide", () => {
    const result = createCategorySchema.safeParse({ name: "Work" });
    expect(result.success).toBe(true);
  });

  // Le champ "description" est optionnel mais accepté s'il est fourni
  it("valide avec description", () => {
    const result = createCategorySchema.safeParse({
      name: "Work",
      description: "Notes de travail",
    });
    expect(result.success).toBe(true);
  });

  // La description peut aussi être explicitement null
  it("accepte description null", () => {
    const result = createCategorySchema.safeParse({
      name: "Work",
      description: null,
    });
    expect(result.success).toBe(true);
  });

  // Le nom ne peut pas être une chaîne vide (min 1 caractère)
  it("rejette si le nom est vide", () => {
    const result = createCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  // Le nom est obligatoire (pas optionnel)
  it("rejette si le nom est manquant", () => {
    const result = createCategorySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  // Limite de 50 caractères sur le nom
  it("rejette si le nom depasse 50 caracteres", () => {
    const result = createCategorySchema.safeParse({ name: "a".repeat(51) });
    expect(result.success).toBe(false);
  });

  // Limite de 255 caractères sur la description
  it("rejette si la description depasse 255 caracteres", () => {
    const result = createCategorySchema.safeParse({
      name: "Work",
      description: "a".repeat(256),
    });
    expect(result.success).toBe(false);
  });
});

// ==================== TESTS : Schéma de mise à jour complète (PUT) ====================
describe("updateCategorySchema", () => {
  it("valide les memes regles que createCategorySchema", () => {
    const result = updateCategorySchema.safeParse({ name: "Updated" });
    expect(result.success).toBe(true);
  });

  // Pour un PUT, le nom est toujours obligatoire
  it("rejette si le nom est manquant", () => {
    const result = updateCategorySchema.safeParse({ description: "Desc" });
    expect(result.success).toBe(false);
  });
});

// ==================== TESTS : Schéma de modification partielle (PATCH) ====================
describe("patchCategorySchema", () => {
  // En PATCH, tous les champs sont optionnels (on ne modifie que ce qu'on veut)
  it("valide un objet vide", () => {
    const result = patchCategorySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("valide avec seulement le nom", () => {
    const result = patchCategorySchema.safeParse({ name: "Patched" });
    expect(result.success).toBe(true);
  });

  it("valide avec seulement la description", () => {
    const result = patchCategorySchema.safeParse({ description: "Nouvelle desc" });
    expect(result.success).toBe(true);
  });

  // Même en PATCH, un nom vide est rejeté (s'il est fourni, il doit être valide)
  it("rejette un nom vide", () => {
    const result = patchCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});
