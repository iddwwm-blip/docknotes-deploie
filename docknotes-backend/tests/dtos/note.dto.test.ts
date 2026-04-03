// Imports des outils de test (pas besoin de vi ici car on ne mock rien)
import { describe, it, expect } from "vitest";

// On importe les schémas de validation Zod qu'on veut tester.
// Un "schéma" définit les règles que les données doivent respecter
// (ex: le titre doit être une string entre 1 et 50 caractères)
import { createNoteSchema, updateNoteSchema, patchNoteSchema } from "@/dtos/note.dto";

// ==================== TESTS : Schéma de création de note ====================
describe("createNoteSchema", () => {
  // safeParse() valide les données SANS lancer d'erreur.
  // Il retourne { success: true, data: ... } si c'est valide,
  // ou { success: false, error: ... } si c'est invalide.
  it("valide des donnees correctes", () => {
    const result = createNoteSchema.safeParse({
      title: "Ma note",
      content: "Mon contenu",
    });
    expect(result.success).toBe(true);
  });

  // Test : Vérifie que les champs optionnels sont acceptés
  it("valide avec tous les champs optionnels", () => {
    const result = createNoteSchema.safeParse({
      title: "Ma note",
      content: "Mon contenu",
      color: "#FF0000",       // Couleur optionnelle
      isFavorite: true,       // Favori optionnel
      category_id: 1,         // Catégorie optionnelle
    });
    expect(result.success).toBe(true);
  });

  // Test : Un titre vide ne passe pas la validation (min 1 caractère)
  it("rejette si le titre est vide", () => {
    const result = createNoteSchema.safeParse({
      title: "",
      content: "Contenu",
    });
    expect(result.success).toBe(false);
  });

  // Test : Le contenu est obligatoire pour créer une note
  it("rejette si le contenu est manquant", () => {
    const result = createNoteSchema.safeParse({
      title: "Titre",
      // Pas de "content" → invalide
    });
    expect(result.success).toBe(false);
  });

  // Test : Vérifie la longueur maximale du titre (50 caractères max)
  it("rejette si le titre depasse 50 caracteres", () => {
    const result = createNoteSchema.safeParse({
      title: "a".repeat(51), // Crée une chaîne de 51 "a"
      content: "Contenu",
    });
    expect(result.success).toBe(false);
  });

  // Test : Vérifie la longueur maximale du contenu (500 caractères max)
  it("rejette si le contenu depasse 500 caracteres", () => {
    const result = createNoteSchema.safeParse({
      title: "Titre",
      content: "a".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  // Test : category_id peut être null (note sans catégorie)
  it("accepte category_id null", () => {
    const result = createNoteSchema.safeParse({
      title: "Titre",
      content: "Contenu",
      category_id: null,
    });
    expect(result.success).toBe(true);
  });
});

// ==================== TESTS : Schéma de mise à jour complète (PUT) ====================
describe("updateNoteSchema", () => {
  it("valide des donnees correctes (tous les champs requis)", () => {
    const result = updateNoteSchema.safeParse({
      title: "Titre",
      content: "Contenu",
      color: "#FFFFFF",
    });
    expect(result.success).toBe(true);
  });

  it("rejette si la couleur est manquante", () => {
    const result = updateNoteSchema.safeParse({
      title: "Titre",
      content: "Contenu",
      // Pas de "color" → invalide pour un PUT
    });
    expect(result.success).toBe(false);
  });

  it("rejette si la couleur est vide", () => {
    const result = updateNoteSchema.safeParse({
      title: "Titre",
      content: "Contenu",
      color: "",
    });
    expect(result.success).toBe(false);
  });
});

// ==================== TESTS : Schéma de modification partielle (PATCH) ====================
describe("patchNoteSchema", () => {
  // Pour un PATCH, TOUS les champs sont optionnels (on ne modifie que ce qu'on veut)
  it("valide un objet vide (tous les champs sont optionnels)", () => {
    const result = patchNoteSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  // On peut ne modifier que le titre
  it("valide avec seulement le titre", () => {
    const result = patchNoteSchema.safeParse({ title: "Nouveau titre" });
    expect(result.success).toBe(true);
  });

  // z.coerce.date() convertit automatiquement une chaîne ISO en objet Date
  it("valide une date ISO", () => {
    const result = patchNoteSchema.safeParse({ date: "2025-01-15T10:00:00Z" });
    expect(result.success).toBe(true);
  });

  // Même en PATCH, les règles de validation s'appliquent (titre pas vide)
  it("rejette un titre vide", () => {
    const result = patchNoteSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });
});
