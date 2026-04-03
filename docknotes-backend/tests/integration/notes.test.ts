import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

/**
 * Mocks de toutes les dépendances externes.
 * Les tests d'intégration notes nécessitent : DB et Auth.
 */

// Mock de Prisma avec les méthodes de la table "note"
vi.mock("@/lib/db", () => ({
  default: {
    note: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("better-auth/node", () => ({
  toNodeHandler: vi.fn(() => vi.fn()),
  fromNodeHeaders: vi.fn((h) => h),
}));

vi.mock("@/lib/cloudinary", () => ({
  default: { uploader: { upload_stream: vi.fn(), destroy: vi.fn() } },
}));

vi.mock("resend", () => ({
  Resend: class { emails = { send: vi.fn() }; },
}));

import app from "@/app";
import db from "@/lib/db";
import { auth } from "@/lib/auth";

// Cast des mocks
const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;

const mockDb = db as unknown as {
  note: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

/**
 * Simule un utilisateur authentifié en configurant getSession
 * pour retourner une session valide avec l'userId donné.
 */
function authenticateUser(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS HTTP : GET /notes ====================
describe("GET /notes (authentifie)", () => {
  // Test : Les routes notes nécessitent une authentification
  it("retourne 401 si non authentifie", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await request(app).get("/notes");

    expect(res.status).toBe(401);
  });

  it("retourne 200 avec les notes de l'utilisateur", async () => {
    authenticateUser();
    const notes = [
      { id: 1, title: "Note 1", content: "Contenu", userId: "user-1" },
    ];
    mockDb.note.findMany.mockResolvedValue(notes);

    const res = await request(app).get("/notes");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(notes);
  });

  // Test : Vérifie que le query parameter "title" est passé comme filtre de recherche
  it("retourne 200 avec filtre de recherche", async () => {
    authenticateUser();
    mockDb.note.findMany.mockResolvedValue([]);

    // ?title=test dans l'URL est récupéré par le contrôleur pour filtrer
    const res = await request(app).get("/notes?title=test");

    expect(res.status).toBe(200);
    // expect.objectContaining vérifie une partie de l'objet (pas besoin de tout vérifier)
    expect(mockDb.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          content: { contains: "test" },
        }),
      })
    );
  });
});

// ==================== TESTS HTTP : GET /notes/:id ====================
describe("GET /notes/:id", () => {
  it("retourne 200 avec la note", async () => {
    authenticateUser();
    const note = { id: 1, title: "Note 1", userId: "user-1", category: null };
    mockDb.note.findUnique.mockResolvedValue(note);

    const res = await request(app).get("/notes/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(note);
  });

  it("retourne 404 si la note n'existe pas", async () => {
    authenticateUser();
    mockDb.note.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/notes/999");

    expect(res.status).toBe(404);
  });

  // Test de sécurité : un utilisateur ne peut pas voir les notes d'un autre
  it("retourne 404 si la note appartient a un autre utilisateur", async () => {
    authenticateUser("user-1");
    mockDb.note.findUnique.mockResolvedValue({
      id: 1, title: "Note", userId: "user-2", // Appartient à user-2
    });

    const res = await request(app).get("/notes/1");

    // 404 au lieu de 403 pour ne pas révéler l'existence de la ressource
    expect(res.status).toBe(404);
  });
});

// ==================== TESTS HTTP : POST /notes ====================
describe("POST /notes", () => {
  it("retourne 201 avec la note creee", async () => {
    authenticateUser();
    const created = {
      id: 1, title: "Nouvelle", content: "Contenu", color: "#FFFFFF",
      isFavorite: false, userId: "user-1",
    };
    mockDb.note.create.mockResolvedValue(created);

    const res = await request(app)
      .post("/notes")
      .send({ title: "Nouvelle", content: "Contenu" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  // Tests de validation des données envoyées par le client
  it("retourne 400 si le titre est manquant", async () => {
    authenticateUser();

    const res = await request(app)
      .post("/notes")
      .send({ content: "Contenu" }); // Pas de "title"

    expect(res.status).toBe(400);
  });

  it("retourne 400 si le contenu est manquant", async () => {
    authenticateUser();

    const res = await request(app)
      .post("/notes")
      .send({ title: "Titre" }); // Pas de "content"

    expect(res.status).toBe(400);
  });

  it("retourne 400 si le titre depasse 50 caracteres", async () => {
    authenticateUser();

    const res = await request(app)
      .post("/notes")
      .send({ title: "a".repeat(51), content: "Contenu" });

    expect(res.status).toBe(400);
  });

  it("retourne 401 si non authentifie", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await request(app)
      .post("/notes")
      .send({ title: "Test", content: "Contenu" });

    expect(res.status).toBe(401);
  });
});

// ==================== TESTS HTTP : PUT /notes/:id ====================
describe("PUT /notes/:id", () => {
  it("retourne 200 avec la note mise a jour", async () => {
    authenticateUser();
    const existing = { id: 1, userId: "user-1" };
    const updated = { id: 1, title: "Updated", content: "New", color: "#000" };
    mockDb.note.findUnique.mockResolvedValue(existing);
    mockDb.note.update.mockResolvedValue(updated);

    const res = await request(app)
      .put("/notes/1")
      .send({ title: "Updated", content: "New", color: "#000" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it("retourne 404 si la note n'appartient pas a l'utilisateur", async () => {
    authenticateUser("user-1");
    mockDb.note.findUnique.mockResolvedValue({ id: 1, userId: "user-2" });

    const res = await request(app)
      .put("/notes/1")
      .send({ title: "Updated", content: "New", color: "#000" });

    expect(res.status).toBe(404);
  });

  it("retourne 400 si les donnees sont invalides", async () => {
    authenticateUser();

    const res = await request(app)
      .put("/notes/1")
      .send({ title: "" }); // Titre vide = invalide

    expect(res.status).toBe(400);
  });
});

// ==================== TESTS HTTP : PATCH /notes/:id ====================
describe("PATCH /notes/:id", () => {
  it("retourne 200 avec la note modifiee", async () => {
    authenticateUser();
    const existing = { id: 1, userId: "user-1" };
    const patched = { id: 1, title: "Patched" };
    mockDb.note.findUnique.mockResolvedValue(existing);
    mockDb.note.update.mockResolvedValue(patched);

    const res = await request(app)
      .patch("/notes/1")
      .send({ title: "Patched" }); // PATCH = modification partielle

    expect(res.status).toBe(200);
    expect(res.body).toEqual(patched);
  });

  it("retourne 400 si le body est vide", async () => {
    authenticateUser();

    const res = await request(app)
      .patch("/notes/1")
      .send({}); // Body vide = rien à modifier

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Aucun champ à modifier");
  });
});

// ==================== TESTS HTTP : DELETE /notes/:id ====================
describe("DELETE /notes/:id", () => {
  it("retourne 204 apres suppression", async () => {
    authenticateUser();
    mockDb.note.findUnique.mockResolvedValue({ id: 1, userId: "user-1" });
    mockDb.note.delete.mockResolvedValue({});

    const res = await request(app).delete("/notes/1");

    expect(res.status).toBe(204);
  });

  it("retourne 404 si la note n'existe pas", async () => {
    authenticateUser();
    mockDb.note.findUnique.mockResolvedValue(null);

    const res = await request(app).delete("/notes/999");

    expect(res.status).toBe(404);
  });

  it("retourne 401 si non authentifie", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await request(app).delete("/notes/1");

    expect(res.status).toBe(401);
  });
});
