import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

/**
 * Mock de Better Auth (système d'authentification).
 * On remplace getSession par une fausse fonction pour simuler
 * différents états : connecté, déconnecté, erreur.
 */
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock de fromNodeHeaders qui convertit les headers Express en format Better Auth
vi.mock("better-auth/node", () => ({
  fromNodeHeaders: vi.fn((headers) => headers),
}));

// Import du middleware qu'on teste
import { authMiddleware } from "@/middlewares/auth.middleware";
import { auth } from "@/lib/auth";

const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;

// Crée un faux Request avec des headers d'authentification
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    // Simule un header Authorization avec un token Bearer
    headers: { authorization: "Bearer token123" },
    ...overrides,
  } as unknown as Request;
}

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS DU MIDDLEWARE D'AUTHENTIFICATION ====================
// Un middleware Express est une fonction qui s'exécute ENTRE la requête et le contrôleur.
// Il peut : modifier la requête (ajouter userId), bloquer la requête (401), ou laisser passer (next())
describe("authMiddleware", () => {
  // Test : Session valide → le middleware ajoute userId à la requête et appelle next()
  it("injecte userId et appelle next() si la session est valide", async () => {
    // Simule une session valide retournée par Better Auth
    mockGetSession.mockResolvedValue({
      user: { id: "user-123" },
    });
    const req = mockReq();
    const res = mockRes();
    // next() est la fonction qui passe au middleware/contrôleur suivant dans la chaîne Express
    const next = vi.fn() as unknown as NextFunction;

    await authMiddleware(req, res, next);

    // Vérifie que le middleware a bien injecté userId dans la requête
    expect(req.userId).toBe("user-123");
    // Vérifie que next() a été appelé (= la requête continue son chemin)
    expect(next).toHaveBeenCalled();
  });

  // Test : Pas de session → le middleware bloque la requête avec 401
  it("retourne 401 si aucune session n'existe", async () => {
    // null = pas de session = utilisateur non connecté
    mockGetSession.mockResolvedValue(null);
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await authMiddleware(req, res, next);

    // 401 = Unauthorized
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Non authentifié" });
    // next() ne doit PAS être appelé (la requête est bloquée)
    expect(next).not.toHaveBeenCalled();
  });

  // Test : Session sans user.id → considéré comme invalide
  it("retourne 401 si la session n'a pas de user.id", async () => {
    // Session qui existe mais sans id (données corrompues ou invalides)
    mockGetSession.mockResolvedValue({ user: {} });
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  // Test : Erreur dans getSession → le middleware gère l'erreur gracieusement
  it("retourne 401 si getSession lance une erreur", async () => {
    // mockRejectedValue simule une erreur (ex: service auth en panne)
    mockGetSession.mockRejectedValue(new Error("Auth error"));
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn() as unknown as NextFunction;

    await authMiddleware(req, res, next);

    // Même en cas d'erreur, on retourne 401 (pas de crash du serveur)
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
