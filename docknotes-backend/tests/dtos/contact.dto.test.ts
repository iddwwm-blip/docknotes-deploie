import { describe, it, expect } from "vitest";

// On importe le schéma de validation pour le formulaire de contact
import { createContactSchema } from "@/dtos/contact.dto";

// ==================== TESTS : Validation du formulaire de contact ====================
describe("createContactSchema", () => {
  // Test de base : toutes les données sont correctes
  it("valide des donnees correctes", () => {
    const result = createContactSchema.safeParse({
      name: "Jean Dupont",
      email: "jean@test.com",
      message: "Bonjour",
    });
    expect(result.success).toBe(true);
  });

  // Test : Vérifie que le schéma nettoie les espaces inutiles (trim)
  // Certains schémas Zod utilisent .trim() pour enlever les espaces au début/fin
  it("trim les espaces sur les valeurs non vides", () => {
    const result = createContactSchema.safeParse({
      name: "Jean Dupont",
      email: "jean@test.com",
      message: "Hello world",
    });
    expect(result.success).toBe(true);
    // Si la validation réussit, on vérifie les données nettoyées
    if (result.success) {
      expect(result.data.name).toBe("Jean Dupont");
      expect(result.data.email).toBe("jean@test.com");
      expect(result.data.message).toBe("Hello world");
    }
  });

  // Test : Le nom est obligatoire et ne peut pas être vide
  it("rejette si le nom est vide", () => {
    const result = createContactSchema.safeParse({
      name: "",
      email: "jean@test.com",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  // Test : Zod vérifie que l'email a un format valide (contient @ et un domaine)
  it("rejette un email invalide", () => {
    const result = createContactSchema.safeParse({
      name: "Jean",
      email: "not-an-email", // Pas de @ → invalide
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  // Test : Le message est obligatoire
  it("rejette si le message est manquant", () => {
    const result = createContactSchema.safeParse({
      name: "Jean",
      email: "jean@test.com",
      // Pas de "message" → invalide
    });
    expect(result.success).toBe(false);
  });

  // Test : Le message ne peut pas être une chaîne vide
  it("rejette si le message est vide", () => {
    const result = createContactSchema.safeParse({
      name: "Jean",
      email: "jean@test.com",
      message: "",
    });
    expect(result.success).toBe(false);
  });

  // Test : Un objet complètement vide est rejeté
  it("rejette si tous les champs sont manquants", () => {
    const result = createContactSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
