// Imports des outils de test Vitest
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import * as noteController from "@/controllers/note.controller";

/**
 * On remplace le vrai service note par des fausses fonctions (mocks).
 * Cela permet de tester le contrôleur SANS toucher à la base de données.
 */
vi.mock("@/services/note.service", () => ({
  getAllNotes: vi.fn(),
  getNoteById: vi.fn(),
  createNote: vi.fn(),
  updateNote: vi.fn(),
  patchNote: vi.fn(),
  deleteNote: vi.fn(),
}));

import * as noteService from "@/services/note.service";

// Cast du service en type mock pour accéder à .mockResolvedValue(), etc.
const mockService = noteService as unknown as {
  getAllNotes: ReturnType<typeof vi.fn>;
  getNoteById: ReturnType<typeof vi.fn>;
  createNote: ReturnType<typeof vi.fn>;
  updateNote: ReturnType<typeof vi.fn>;
  patchNote: ReturnType<typeof vi.fn>;
  deleteNote: ReturnType<typeof vi.fn>;
};

/**
 * Crée un faux objet Request Express.
 * userId est inclus car les routes notes nécessitent un utilisateur authentifié.
 */
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    userId: "user-1",  // Simule un utilisateur connecté
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

/**
 * Crée un faux objet Response Express avec les méthodes status, json et send.
 * mockReturnThis() permet le chaînage : res.status(200).json(data)
 */
function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

// Réinitialise tous les mocks avant chaque test
beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS : Récupérer toutes les notes ====================
describe("noteController.getAll", () => {
  it("retourne les notes avec status 200", async () => {
    const notes = [{ id: 1, title: "Note 1" }];
    mockService.getAllNotes.mockResolvedValue(notes);
    // On simule un query parameter "title=Note" (ex: GET /notes?title=Note)
    const req = mockReq({ query: { title: "Note" } } as Partial<Request>);
    const res = mockRes();

    await noteController.getAll(req, res);

    // Vérifie que le service a été appelé avec le bon userId et le filtre de recherche
    expect(mockService.getAllNotes).toHaveBeenCalledWith("user-1", "Note");
    expect(res.json).toHaveBeenCalledWith(notes);
  });

  it("retourne 500 en cas d'erreur serveur", async () => {
    mockService.getAllNotes.mockRejectedValue(new Error("DB error"));
    const req = mockReq();
    const res = mockRes();

    await noteController.getAll(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ==================== TESTS : Récupérer une note par ID ====================
describe("noteController.getById", () => {
  it("retourne la note avec status 200", async () => {
    const note = { id: 1, title: "Note 1" };
    mockService.getNoteById.mockResolvedValue(note);
    const req = mockReq({ params: { id: "1" } } as Partial<Request>);
    const res = mockRes();

    await noteController.getById(req, res);

    expect(res.json).toHaveBeenCalledWith(note);
  });

  it("retourne 404 si la note n'existe pas", async () => {
    mockService.getNoteById.mockResolvedValue(null);
    const req = mockReq({ params: { id: "999" } } as Partial<Request>);
    const res = mockRes();

    await noteController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ==================== TESTS : Créer une note ====================
describe("noteController.create", () => {
  it("cree une note et retourne 201", async () => {
    const created = { id: 1, title: "New", content: "Content" };
    mockService.createNote.mockResolvedValue(created);
    const req = mockReq({
      body: { title: "New", content: "Content" },
    });
    const res = mockRes();

    await noteController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  // Vérifie que la validation rejette un titre vide
  it("retourne 400 si les donnees sont invalides", async () => {
    const req = mockReq({ body: { title: "" } });
    const res = mockRes();

    await noteController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    // Le service ne doit PAS être appelé si la validation échoue
    expect(mockService.createNote).not.toHaveBeenCalled();
  });

  it("retourne 400 si le body est vide", async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await noteController.create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ==================== TESTS : Mise à jour complète (PUT) ====================
describe("noteController.update", () => {
  it("met a jour la note et retourne 200", async () => {
    const updated = { id: 1, title: "Updated" };
    mockService.updateNote.mockResolvedValue(updated);
    const req = mockReq({
      params: { id: "1" },
      body: { title: "Updated", content: "New content", color: "#000" },
    } as Partial<Request>);
    const res = mockRes();

    await noteController.update(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it("retourne 404 si la note n'existe pas", async () => {
    // null = le service n'a pas trouvé la note (ou elle appartient à un autre utilisateur)
    mockService.updateNote.mockResolvedValue(null);
    const req = mockReq({
      params: { id: "999" },
      body: { title: "Updated", content: "New content", color: "#000" },
    } as Partial<Request>);
    const res = mockRes();

    await noteController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("retourne 400 si les donnees sont invalides", async () => {
    const req = mockReq({
      params: { id: "1" },
      body: { title: "" }, // Titre vide = invalide
    } as Partial<Request>);
    const res = mockRes();

    await noteController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ==================== TESTS : Modification partielle (PATCH) ====================
describe("noteController.patch", () => {
  // PATCH permet de ne modifier qu'un seul champ (ici, juste le titre)
  it("modifie partiellement la note", async () => {
    const patched = { id: 1, title: "Patched" };
    mockService.patchNote.mockResolvedValue(patched);
    const req = mockReq({
      params: { id: "1" },
      body: { title: "Patched" },
    } as Partial<Request>);
    const res = mockRes();

    await noteController.patch(req, res);

    expect(res.json).toHaveBeenCalledWith(patched);
  });

  it("retourne 400 si le body est vide (aucun champ)", async () => {
    const req = mockReq({
      params: { id: "1" },
      body: {},
    } as Partial<Request>);
    const res = mockRes();

    await noteController.patch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Aucun champ à modifier" });
  });
});

// ==================== TESTS : Supprimer une note ====================
describe("noteController.remove", () => {
  it("supprime la note et retourne 204", async () => {
    mockService.deleteNote.mockResolvedValue(true);
    const req = mockReq({ params: { id: "1" } } as Partial<Request>);
    const res = mockRes();

    await noteController.remove(req, res);

    // 204 = suppression réussie, pas de contenu à renvoyer
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it("retourne 404 si la note n'existe pas", async () => {
    mockService.deleteNote.mockResolvedValue(null);
    const req = mockReq({ params: { id: "999" } } as Partial<Request>);
    const res = mockRes();

    await noteController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
