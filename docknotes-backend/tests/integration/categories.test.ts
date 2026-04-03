import { describe, it, expect, vi, beforeEach } from "vitest";

// supertest permet d'envoyer de VRAIES requêtes HTTP à notre app Express
// sans avoir besoin de démarrer un serveur (pas de app.listen())
import request from "supertest";

/**
 * TESTS D'INTÉGRATION : contrairement aux tests unitaires (qui testent une seule fonction),
 * les tests d'intégration testent le flux complet :
 * Requête HTTP → Route → Contrôleur → Service → (mock de la) DB → Réponse HTTP
 *
 * On mock quand même la DB et les services externes (auth, cloudinary, resend)
 * pour ne pas dépendre d'infrastructures réelles pendant les tests.
 */

// Mock de Prisma (base de données)
vi.mock("@/lib/db", () => ({
  default: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(), // Simule la connexion à la DB
  },
}));

// Mock de Better Auth (authentification)
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

// Mock du handler Better Auth pour Express
// toNodeHandler convertit Better Auth en middleware Express
// fromNodeHeaders convertit les headers Node.js en format Better Auth
vi.mock("better-auth/node", () => ({
  toNodeHandler: vi.fn(() => vi.fn()),
  fromNodeHeaders: vi.fn((h) => h),
}));

// Mock de Cloudinary (stockage d'images)
vi.mock("@/lib/cloudinary", () => ({
  default: { uploader: { upload_stream: vi.fn(), destroy: vi.fn() } },
}));

// Mock de Resend (envoi d'emails)
vi.mock("resend", () => ({
  Resend: class { emails = { send: vi.fn() }; },
}));

// On importe l'app Express APRÈS les mocks pour qu'elle utilise les versions mockées
import app from "@/app";
import db from "@/lib/db";

// Cast du client Prisma en type mock
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

// ==================== TESTS HTTP : GET /categories ====================
describe("GET /categories", () => {
  it("retourne 200 avec la liste des categories", async () => {
    const categories = [
      { id: 1, name: "Work", description: null },
      { id: 2, name: "Personal", description: "Perso" },
    ];
    mockDb.category.findMany.mockResolvedValue(categories);

    // request(app).get("/categories") envoie une requête GET à l'app
    const res = await request(app).get("/categories");

    // Vérifie le code HTTP et le body de la réponse
    expect(res.status).toBe(200);
    expect(res.body).toEqual(categories);
  });

  it("retourne 200 avec un tableau vide si aucune categorie", async () => {
    mockDb.category.findMany.mockResolvedValue([]);

    const res = await request(app).get("/categories");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ==================== TESTS HTTP : GET /categories/:id ====================
describe("GET /categories/:id", () => {
  it("retourne 200 avec la categorie", async () => {
    const category = { id: 1, name: "Work", description: null };
    mockDb.category.findUnique.mockResolvedValue(category);

    const res = await request(app).get("/categories/1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(category);
  });

  it("retourne 404 si la categorie n'existe pas", async () => {
    mockDb.category.findUnique.mockResolvedValue(null);

    const res = await request(app).get("/categories/999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Category not found");
  });
});

// ==================== TESTS HTTP : POST /categories ====================
describe("POST /categories", () => {
  it("retourne 201 avec la categorie creee", async () => {
    const created = { id: 1, name: "Work", description: null };
    mockDb.category.create.mockResolvedValue(created);

    // .send() envoie un body JSON avec la requête POST
    const res = await request(app)
      .post("/categories")
      .send({ name: "Work" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
  });

  // Tests de validation : vérifient que l'API rejette les données invalides
  it("retourne 400 si le nom est manquant", async () => {
    const res = await request(app)
      .post("/categories")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Données invalides");
  });

  it("retourne 400 si le nom est vide", async () => {
    const res = await request(app)
      .post("/categories")
      .send({ name: "" });

    expect(res.status).toBe(400);
  });

  it("retourne 400 si le nom depasse 50 caracteres", async () => {
    const res = await request(app)
      .post("/categories")
      .send({ name: "a".repeat(51) });

    expect(res.status).toBe(400);
  });
});

// ==================== TESTS HTTP : PUT /categories/:id ====================
describe("PUT /categories/:id", () => {
  it("retourne 200 avec la categorie mise a jour", async () => {
    const updated = { id: 1, name: "Updated", description: null };
    mockDb.category.update.mockResolvedValue(updated);

    const res = await request(app)
      .put("/categories/1")
      .send({ name: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  // P2025 est le code d'erreur Prisma pour "enregistrement non trouvé"
  it("retourne 404 si la categorie n'existe pas (Prisma P2025)", async () => {
    mockDb.category.update.mockRejectedValue({ code: "P2025" });

    const res = await request(app)
      .put("/categories/999")
      .send({ name: "Updated" });

    expect(res.status).toBe(404);
  });

  it("retourne 400 si les donnees sont invalides", async () => {
    const res = await request(app)
      .put("/categories/1")
      .send({ name: "" });

    expect(res.status).toBe(400);
  });
});

// ==================== TESTS HTTP : PATCH /categories/:id ====================
describe("PATCH /categories/:id", () => {
  it("retourne 200 avec la categorie modifiee", async () => {
    const patched = { id: 1, name: "Patched", description: null };
    mockDb.category.update.mockResolvedValue(patched);

    const res = await request(app)
      .patch("/categories/1")
      .send({ name: "Patched" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(patched);
  });

  it("retourne 400 si le body est vide", async () => {
    const res = await request(app)
      .patch("/categories/1")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Aucun champ à modifier");
  });
});

// ==================== TESTS HTTP : DELETE /categories/:id ====================
describe("DELETE /categories/:id", () => {
  it("retourne 204 apres suppression", async () => {
    mockDb.category.delete.mockResolvedValue({});

    const res = await request(app).delete("/categories/1");

    // 204 = No Content (supprimé avec succès, rien à retourner)
    expect(res.status).toBe(204);
  });

  it("retourne 404 si la categorie n'existe pas", async () => {
    mockDb.category.delete.mockRejectedValue({ code: "P2025" });

    const res = await request(app).delete("/categories/999");

    expect(res.status).toBe(404);
  });
});
