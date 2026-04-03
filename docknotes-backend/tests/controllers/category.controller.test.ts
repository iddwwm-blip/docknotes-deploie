// On importe les outils de test depuis Vitest :
// - describe : regroupe des tests par thème (comme un dossier de tests)
// - it : définit un test individuel (un scénario à vérifier)
// - expect : permet de vérifier qu'une valeur correspond à ce qu'on attend
// - vi : utilitaire pour créer des "mocks" (faux objets/fonctions qui simulent le vrai code)
// - beforeEach : fonction exécutée avant CHAQUE test pour repartir sur une base propre
import { describe, it, expect, vi, beforeEach } from "vitest";

// On importe les types Request et Response d'Express pour typer nos faux objets
import { Request, Response } from "express";

// On importe le contrôleur qu'on veut tester
import * as categoryController from "@/controllers/category.controller";

/**
 * vi.mock() remplace le vrai module par une version "fausse" (mock).
 * Ici, au lieu d'appeler la vraie base de données, chaque fonction du service
 * est remplacée par vi.fn() — une fausse fonction dont on peut contrôler
 * le comportement (quelle valeur elle retourne, si elle échoue, etc.)
 */
vi.mock("@/services/category.service", () => ({
  getAllCategories: vi.fn(),
  getCategoryById: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  patchCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

// On importe le service APRÈS le mock, pour que l'import utilise la version mockée
import * as categoryService from "@/services/category.service";

// On "caste" (convertit le type) du service pour que TypeScript comprenne
// que chaque fonction est un mock (et nous permette d'utiliser .mockResolvedValue, etc.)
const mockService = categoryService as unknown as {
  getAllCategories: ReturnType<typeof vi.fn>;
  getCategoryById: ReturnType<typeof vi.fn>;
  createCategory: ReturnType<typeof vi.fn>;
  updateCategory: ReturnType<typeof vi.fn>;
  patchCategory: ReturnType<typeof vi.fn>;
  deleteCategory: ReturnType<typeof vi.fn>;
};

/**
 * Crée un faux objet Request d'Express.
 * On peut passer des valeurs personnalisées via "overrides" pour simuler
 * différents scénarios (ex: un body avec des données, des params d'URL, etc.)
 */
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    query: {},    // Les paramètres de l'URL après le "?" (ex: ?search=test)
    params: {},   // Les paramètres de route (ex: /categories/:id → params.id)
    body: {},     // Le corps de la requête (données envoyées par le client)
    ...overrides, // On écrase les valeurs par défaut avec celles passées en argument
  } as unknown as Request;
}

/**
 * Crée un faux objet Response d'Express.
 * - status() : simule res.status(200), retourne "this" pour le chaînage (res.status(200).json(...))
 * - json() : simule res.json(data), envoie une réponse JSON
 * - send() : simule res.send(), envoie une réponse brute
 * mockReturnThis() permet le chaînage : res.status(201).json(data) fonctionne car status() retourne res
 */
function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

// Avant chaque test, on réinitialise tous les mocks pour éviter
// qu'un test précédent n'influence le suivant
beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS DU CONTRÔLEUR CATEGORY ====================

// Groupe de tests pour la méthode getAll du contrôleur
describe("categoryController.getAll", () => {
  // Test 1 : Vérifie que le contrôleur retourne bien la liste des catégories
  it("retourne toutes les categories", async () => {
    // On configure le mock pour qu'il retourne un tableau de catégories
    // mockResolvedValue = "quand cette fonction est appelée, elle retourne cette valeur"
    const categories = [{ id: 1, name: "Work" }];
    mockService.getAllCategories.mockResolvedValue(categories);
    const res = mockRes();

    // On appelle la vraie fonction du contrôleur avec nos faux req/res
    await categoryController.getAll(mockReq(), res);

    // On vérifie que res.json a été appelé avec les bonnes catégories
    expect(res.json).toHaveBeenCalledWith(categories);
  });

  // Test 2 : Vérifie que le contrôleur retourne une erreur 500 si le service plante
  it("retourne 500 en cas d'erreur", async () => {
    // mockRejectedValue = simule une erreur (la promesse est rejetée)
    mockService.getAllCategories.mockRejectedValue(new Error("DB error"));
    const res = mockRes();

    await categoryController.getAll(mockReq(), res);

    // On vérifie que le statut HTTP 500 (erreur serveur) a été renvoyé
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("categoryController.getById", () => {
  // Test : Vérifie qu'on récupère bien une catégorie par son ID
  it("retourne la categorie si elle existe", async () => {
    const category = { id: 1, name: "Work" };
    mockService.getCategoryById.mockResolvedValue(category);
    // On simule une requête avec l'ID "1" dans l'URL (ex: GET /categories/1)
    const req = mockReq({ params: { id: "1" } } as Partial<Request>);
    const res = mockRes();

    await categoryController.getById(req, res);

    expect(res.json).toHaveBeenCalledWith(category);
  });

  // Test : Vérifie qu'on retourne 404 (non trouvé) si la catégorie n'existe pas
  it("retourne 404 si elle n'existe pas", async () => {
    // Le service retourne null = catégorie non trouvée
    mockService.getCategoryById.mockResolvedValue(null);
    const req = mockReq({ params: { id: "999" } } as Partial<Request>);
    const res = mockRes();

    await categoryController.getById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("categoryController.create", () => {
  // Test : Vérifie que la création fonctionne et retourne un status 201 (créé)
  it("cree une categorie et retourne 201", async () => {
    const created = { id: 1, name: "Work" };
    mockService.createCategory.mockResolvedValue(created);
    // On simule un body avec le nom de la catégorie à créer
    const req = mockReq({ body: { name: "Work" } });
    const res = mockRes();

    await categoryController.create(req, res);

    // 201 = "Created" : la ressource a bien été créée
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  // Test : Vérifie que le contrôleur rejette un body sans nom
  it("retourne 400 si le nom est manquant", async () => {
    const req = mockReq({ body: {} }); // Pas de "name" dans le body
    const res = mockRes();

    await categoryController.create(req, res);

    // 400 = "Bad Request" : les données envoyées sont invalides
    expect(res.status).toHaveBeenCalledWith(400);
    // On vérifie que le service n'a PAS été appelé (pas besoin de créer si les données sont invalides)
    expect(mockService.createCategory).not.toHaveBeenCalled();
  });
});

describe("categoryController.update", () => {
  // Test : Vérifie la mise à jour complète d'une catégorie (PUT)
  it("met a jour la categorie", async () => {
    const updated = { id: 1, name: "Updated" };
    mockService.updateCategory.mockResolvedValue(updated);
    const req = mockReq({
      params: { id: "1" },           // L'ID de la catégorie à modifier
      body: { name: "Updated" },      // Les nouvelles données
    } as Partial<Request>);
    const res = mockRes();

    await categoryController.update(req, res);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  // Test : Vérifie le comportement quand Prisma retourne l'erreur P2025
  // P2025 = "Record to update/delete not found" (l'enregistrement n'existe pas en DB)
  it("retourne 404 si Prisma P2025", async () => {
    mockService.updateCategory.mockRejectedValue({ code: "P2025" });
    const req = mockReq({
      params: { id: "999" },
      body: { name: "Updated" },
    } as Partial<Request>);
    const res = mockRes();

    await categoryController.update(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe("categoryController.patch", () => {
  // Test : Vérifie la modification partielle d'une catégorie (PATCH)
  // Contrairement à PUT qui remplace tout, PATCH ne modifie que les champs envoyés
  it("modifie partiellement la categorie", async () => {
    const patched = { id: 1, name: "Patched" };
    mockService.patchCategory.mockResolvedValue(patched);
    const req = mockReq({
      params: { id: "1" },
      body: { name: "Patched" },
    } as Partial<Request>);
    const res = mockRes();

    await categoryController.patch(req, res);

    expect(res.json).toHaveBeenCalledWith(patched);
  });

  // Test : Vérifie qu'on refuse un PATCH avec un body vide (rien à modifier)
  it("retourne 400 si aucun champ n'est fourni", async () => {
    const req = mockReq({
      params: { id: "1" },
      body: {},               // Body vide = aucun champ à modifier
    } as Partial<Request>);
    const res = mockRes();

    await categoryController.patch(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Aucun champ à modifier" });
  });
});

describe("categoryController.remove", () => {
  // Test : Vérifie que la suppression retourne 204 (No Content = supprimé, rien à retourner)
  it("supprime la categorie et retourne 204", async () => {
    mockService.deleteCategory.mockResolvedValue(true);
    const req = mockReq({ params: { id: "1" } } as Partial<Request>);
    const res = mockRes();

    await categoryController.remove(req, res);

    // 204 = "No Content" : la suppression a réussi, pas de body en réponse
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  // Test : Vérifie qu'on retourne 404 si on essaie de supprimer une catégorie inexistante
  it("retourne 404 si Prisma P2025", async () => {
    mockService.deleteCategory.mockRejectedValue({ code: "P2025" });
    const req = mockReq({ params: { id: "999" } } as Partial<Request>);
    const res = mockRes();

    await categoryController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
