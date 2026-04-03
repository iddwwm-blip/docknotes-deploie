// Imports des outils de test Vitest et des types Express
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import * as imageController from "@/controllers/image.controller";

/**
 * On mock le service image pour ne pas faire de vrais uploads Cloudinary pendant les tests.
 */
vi.mock("@/services/image.service", () => ({
  uploadImage: vi.fn(),
  getAllImages: vi.fn(),
  deleteImage: vi.fn(),
}));

import * as imageService from "@/services/image.service";

// Cast pour accéder aux méthodes de mock
const mockService = imageService as unknown as {
  uploadImage: ReturnType<typeof vi.fn>;
  getAllImages: ReturnType<typeof vi.fn>;
  deleteImage: ReturnType<typeof vi.fn>;
};

// Crée un faux Request avec un userId par défaut (utilisateur authentifié)
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    userId: "user-1",
    params: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

// Crée un faux Response avec status, json et send mockés
function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS : Upload d'image ====================
describe("imageController.upload", () => {
  it("upload l'image et retourne 201", async () => {
    const created = { id: 1, url: "https://cdn.test.com/img.webp" };
    mockService.uploadImage.mockResolvedValue(created);
    // On simule un fichier uploadé via Multer (middleware qui gère les fichiers)
    // req.file contient le buffer (données brutes) du fichier envoyé par l'utilisateur
    const req = mockReq({
      file: { buffer: Buffer.from("fake") } as Express.Multer.File,
    } as Partial<Request>);
    const res = mockRes();

    await imageController.upload(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  // Test : Vérifie le comportement quand aucun fichier n'est envoyé
  it("retourne 400 si aucun fichier n'est fourni", async () => {
    const req = mockReq(); // Pas de req.file = pas de fichier
    const res = mockRes();

    await imageController.upload(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Aucune image fournie" });
  });

  // Test : Vérifie la gestion d'erreur si Cloudinary tombe en panne
  it("retourne 500 si le service echoue", async () => {
    mockService.uploadImage.mockRejectedValue(new Error("Upload failed"));
    const req = mockReq({
      file: { buffer: Buffer.from("fake") } as Express.Multer.File,
    } as Partial<Request>);
    const res = mockRes();

    await imageController.upload(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ==================== TESTS : Récupérer toutes les images ====================
describe("imageController.getAll", () => {
  it("retourne toutes les images", async () => {
    const images = [{ id: 1, url: "https://cdn.test.com/img.webp" }];
    mockService.getAllImages.mockResolvedValue(images);
    const req = mockReq();
    const res = mockRes();

    await imageController.getAll(req, res);

    expect(res.json).toHaveBeenCalledWith(images);
  });
});

// ==================== TESTS : Supprimer une image ====================
describe("imageController.remove", () => {
  it("supprime l'image et retourne 204", async () => {
    mockService.deleteImage.mockResolvedValue(true);
    const req = mockReq({ params: { id: "1" } } as Partial<Request>);
    const res = mockRes();

    await imageController.remove(req, res);

    // 204 = suppression réussie, pas de contenu en réponse
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("retourne 404 si l'image n'existe pas", async () => {
    // null = image non trouvée ou n'appartient pas à l'utilisateur
    mockService.deleteImage.mockResolvedValue(null);
    const req = mockReq({ params: { id: "999" } } as Partial<Request>);
    const res = mockRes();

    await imageController.remove(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
