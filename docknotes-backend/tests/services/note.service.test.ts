import { describe, it, expect, vi, beforeEach } from "vitest";
import * as noteService from "@/services/note.service";

/**
 * Mock du client Prisma.
 * On remplace la vraie connexion à la base de données par des fausses fonctions.
 * Cela permet de tester la logique du service SANS avoir besoin d'une vraie DB.
 */
vi.mock("@/lib/db", () => {
  return {
    default: {
      note: {
        findMany: vi.fn(),    // Simule la recherche de plusieurs notes
        findUnique: vi.fn(),  // Simule la recherche d'une note par ID
        create: vi.fn(),      // Simule la création d'une note
        update: vi.fn(),      // Simule la mise à jour d'une note
        delete: vi.fn(),      // Simule la suppression d'une note
      },
    },
  };
});

// Import APRÈS le mock pour obtenir la version mockée
import db from "@/lib/db";

// Cast du client Prisma en type mock pour accéder à .mockResolvedValue(), etc.
const mockDb = db as unknown as {
  note: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

// Nettoyage avant chaque test
beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS : Récupérer toutes les notes ====================
describe("noteService.getAllNotes", () => {
  it("retourne toutes les notes d'un utilisateur", async () => {
    // On prépare les fausses données que la DB va "retourner"
    const fakeNotes = [
      { id: 1, title: "Note 1", userId: "user-1" },
      { id: 2, title: "Note 2", userId: "user-1" },
    ];
    mockDb.note.findMany.mockResolvedValue(fakeNotes);

    // On appelle la vraie fonction du service
    const result = await noteService.getAllNotes("user-1");

    // On vérifie que Prisma a été appelé avec les bons arguments :
    // - where: filtre par userId
    // - orderBy: trie par date décroissante (plus récent en premier)
    // - include: inclut les données de la catégorie liée
    expect(mockDb.note.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { date: "desc" },
      include: { category: { select: { name: true, description: true } } },
    });
    expect(result).toEqual(fakeNotes);
  });

  // Test : Vérifie que le filtre de recherche fonctionne
  it("applique le filtre de recherche sur le contenu", async () => {
    mockDb.note.findMany.mockResolvedValue([]);

    // On passe "test" comme paramètre de recherche
    await noteService.getAllNotes("user-1", "test");

    // Vérifie que Prisma cherche "test" dans le contenu (contains = "contient")
    expect(mockDb.note.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", content: { contains: "test" } },
      orderBy: { date: "desc" },
      include: { category: { select: { name: true, description: true } } },
    });
  });

  // Test : Vérifie que sans recherche, le filtre content n'est pas ajouté
  it("ne filtre pas si search est undefined", async () => {
    mockDb.note.findMany.mockResolvedValue([]);

    await noteService.getAllNotes("user-1", undefined);

    // Pas de filtre "content" dans le where
    expect(mockDb.note.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { date: "desc" },
      include: { category: { select: { name: true, description: true } } },
    });
  });
});

// ==================== TESTS : Récupérer une note par ID ====================
describe("noteService.getNoteById", () => {
  it("retourne la note si elle appartient a l'utilisateur", async () => {
    const fakeNote = { id: 1, title: "Note 1", userId: "user-1" };
    mockDb.note.findUnique.mockResolvedValue(fakeNote);

    const result = await noteService.getNoteById(1, "user-1");

    expect(result).toEqual(fakeNote);
  });

  it("retourne null si la note n'existe pas", async () => {
    // findUnique retourne null quand l'ID n'existe pas
    mockDb.note.findUnique.mockResolvedValue(null);

    const result = await noteService.getNoteById(999, "user-1");

    expect(result).toBeNull();
  });

  // Test de sécurité : un utilisateur ne peut pas voir les notes d'un autre
  it("retourne null si la note appartient a un autre utilisateur", async () => {
    // La note existe mais appartient à "user-2"
    const fakeNote = { id: 1, title: "Note 1", userId: "user-2" };
    mockDb.note.findUnique.mockResolvedValue(fakeNote);

    // "user-1" essaie d'y accéder → le service retourne null
    const result = await noteService.getNoteById(1, "user-1");

    expect(result).toBeNull();
  });
});

// ==================== TESTS : Créer une note ====================
describe("noteService.createNote", () => {
  it("cree une note avec les valeurs par defaut", async () => {
    const created = { id: 1, title: "Test", content: "Contenu", color: "#FFFFFF", isFavorite: false };
    mockDb.note.create.mockResolvedValue(created);

    const result = await noteService.createNote("user-1", {
      title: "Test",
      content: "Contenu",
    });

    // expect.objectContaining() vérifie que l'objet contient AU MOINS ces propriétés
    // (il peut en avoir d'autres, comme "date")
    expect(mockDb.note.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Test",
        content: "Contenu",
        color: "#FFFFFF",         // Valeur par défaut si non spécifiée
        isFavorite: false,        // Valeur par défaut
        category_id: null,        // Pas de catégorie par défaut
        userId: "user-1",
      }),
    });
    expect(result).toEqual(created);
  });

  // Test : Vérifie que les valeurs personnalisées écrasent les valeurs par défaut
  it("cree une note avec couleur et categorie personnalisees", async () => {
    const created = { id: 2, title: "Test", color: "#FF0000", category_id: 3 };
    mockDb.note.create.mockResolvedValue(created);

    await noteService.createNote("user-1", {
      title: "Test",
      content: "Contenu",
      color: "#FF0000",
      isFavorite: true,
      category_id: 3,
    });

    expect(mockDb.note.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        color: "#FF0000",
        isFavorite: true,
        category_id: 3,
      }),
    });
  });
});

// ==================== TESTS : Mise à jour complète (PUT) ====================
describe("noteService.updateNote", () => {
  it("met a jour la note si elle appartient a l'utilisateur", async () => {
    // D'abord, on simule que la note existe et appartient au bon utilisateur
    const existing = { id: 1, userId: "user-1" };
    const updated = { id: 1, title: "Updated", content: "New", color: "#000" };
    mockDb.note.findUnique.mockResolvedValue(existing);
    mockDb.note.update.mockResolvedValue(updated);

    const result = await noteService.updateNote(1, "user-1", {
      title: "Updated",
      content: "New",
      color: "#000",
    });

    expect(result).toEqual(updated);
  });

  // Test de sécurité : on ne peut pas modifier la note d'un autre utilisateur
  it("retourne null si la note n'appartient pas a l'utilisateur", async () => {
    mockDb.note.findUnique.mockResolvedValue({ id: 1, userId: "user-2" });

    const result = await noteService.updateNote(1, "user-1", {
      title: "Updated",
      content: "New",
      color: "#000",
    });

    expect(result).toBeNull();
    // Vérifie que update n'a PAS été appelé (pas de modification non autorisée)
    expect(mockDb.note.update).not.toHaveBeenCalled();
  });

  it("retourne null si la note n'existe pas", async () => {
    mockDb.note.findUnique.mockResolvedValue(null);

    const result = await noteService.updateNote(999, "user-1", {
      title: "Updated",
      content: "New",
      color: "#000",
    });

    expect(result).toBeNull();
  });
});

// ==================== TESTS : Modification partielle (PATCH) ====================
describe("noteService.patchNote", () => {
  // PATCH ne modifie que les champs envoyés (ici, uniquement le titre)
  it("modifie partiellement la note", async () => {
    const existing = { id: 1, userId: "user-1" };
    const patched = { id: 1, title: "Patched" };
    mockDb.note.findUnique.mockResolvedValue(existing);
    mockDb.note.update.mockResolvedValue(patched);

    const result = await noteService.patchNote(1, "user-1", { title: "Patched" });

    // Vérifie que seul le titre est passé dans data (pas tous les champs)
    expect(mockDb.note.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { title: "Patched" },
    });
    expect(result).toEqual(patched);
  });

  it("retourne null si la note n'appartient pas a l'utilisateur", async () => {
    mockDb.note.findUnique.mockResolvedValue({ id: 1, userId: "user-2" });

    const result = await noteService.patchNote(1, "user-1", { title: "Patched" });

    expect(result).toBeNull();
  });
});

// ==================== TESTS : Supprimer une note ====================
describe("noteService.deleteNote", () => {
  it("supprime la note et retourne true", async () => {
    mockDb.note.findUnique.mockResolvedValue({ id: 1, userId: "user-1" });
    mockDb.note.delete.mockResolvedValue({});

    const result = await noteService.deleteNote(1, "user-1");

    expect(result).toBe(true);
    expect(mockDb.note.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("retourne null si la note n'appartient pas a l'utilisateur", async () => {
    mockDb.note.findUnique.mockResolvedValue({ id: 1, userId: "user-2" });

    const result = await noteService.deleteNote(1, "user-1");

    expect(result).toBeNull();
    // La suppression ne doit PAS avoir lieu
    expect(mockDb.note.delete).not.toHaveBeenCalled();
  });

  it("retourne null si la note n'existe pas", async () => {
    mockDb.note.findUnique.mockResolvedValue(null);

    const result = await noteService.deleteNote(999, "user-1");

    expect(result).toBeNull();
  });
});
