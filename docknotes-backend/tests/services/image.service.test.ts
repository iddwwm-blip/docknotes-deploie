import { describe, it, expect, vi, beforeEach } from "vitest";
import * as imageService from "@/services/image.service";

/**
 * Mock du client Prisma pour la table "image".
 */
vi.mock("@/lib/db", () => {
  return {
    default: {
      image: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

/**
 * Mock de Cloudinary.
 * upload_stream : envoie un fichier vers Cloudinary (retourne un stream)
 * destroy : supprime un fichier de Cloudinary via son publicId
 * Les fonctions sont définies dans la factory pour éviter le "hoisting"
 * (JavaScript remonte les vi.mock en haut du fichier automatiquement)
 */
vi.mock("@/lib/cloudinary", () => {
  return {
    default: {
      uploader: {
        upload_stream: vi.fn(),
        destroy: vi.fn(),
      },
    },
  };
});

import db from "@/lib/db";
import cloudinary from "@/lib/cloudinary";

// Cast des mocks pour pouvoir utiliser .mockResolvedValue(), etc.
const mockDb = db as unknown as {
  image: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const mockUploadStream = cloudinary.uploader.upload_stream as ReturnType<typeof vi.fn>;
const mockDestroy = cloudinary.uploader.destroy as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS : Récupérer toutes les images ====================
describe("imageService.getAllImages", () => {
  it("retourne toutes les images d'un utilisateur", async () => {
    const fakeImages = [
      { id: 1, url: "https://cdn.test.com/img1.webp", userId: "user-1" },
    ];
    mockDb.image.findMany.mockResolvedValue(fakeImages);

    const result = await imageService.getAllImages("user-1");

    // Vérifie le filtre par userId et le tri par date de création décroissante
    expect(mockDb.image.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toEqual(fakeImages);
  });
});

// ==================== TESTS : Upload d'image ====================
describe("imageService.uploadImage", () => {
  it("upload une image sur Cloudinary et l'enregistre en DB", async () => {
    // Simule la réponse de Cloudinary après un upload réussi
    const fakeResult = {
      secure_url: "https://cdn.test.com/img.webp",  // URL publique de l'image
      public_id: "docknotes/user-1/abc123",          // Identifiant unique sur Cloudinary
    };

    // mockImplementation permet de contrôler le comportement exact de la fonction.
    // upload_stream prend des options et un callback, puis retourne un stream.
    // On simule un upload réussi en appelant le callback avec (null, résultat)
    // null = pas d'erreur, fakeResult = les données retournées par Cloudinary
    mockUploadStream.mockImplementation((_options: unknown, callback: Function) => {
      callback(null, fakeResult);
      return { end: vi.fn() }; // Le stream a une méthode end() pour finir l'envoi
    });

    const createdImage = {
      id: 1,
      url: fakeResult.secure_url,
      publicId: fakeResult.public_id,
      userId: "user-1",
    };
    mockDb.image.create.mockResolvedValue(createdImage);

    // Buffer.from("fake-image") crée un faux buffer binaire qui simule un fichier image
    const result = await imageService.uploadImage("user-1", Buffer.from("fake-image"));

    // Vérifie que l'image a bien été enregistrée en DB avec les bonnes données
    expect(mockDb.image.create).toHaveBeenCalledWith({
      data: {
        url: fakeResult.secure_url,
        publicId: fakeResult.public_id,
        userId: "user-1",
      },
    });
    expect(result).toEqual(createdImage);
  });

  // Test : Vérifie que le service gère les erreurs de Cloudinary
  it("rejette si Cloudinary echoue", async () => {
    // On simule une erreur Cloudinary en passant une Error comme 1er argument du callback
    mockUploadStream.mockImplementation((_options: unknown, callback: Function) => {
      callback(new Error("Upload failed"), null);
      return { end: vi.fn() };
    });

    // rejects.toThrow vérifie que la promesse est rejetée avec cette erreur
    await expect(
      imageService.uploadImage("user-1", Buffer.from("fake"))
    ).rejects.toThrow("Upload failed");
  });
});

// ==================== TESTS : Supprimer une image ====================
describe("imageService.deleteImage", () => {
  it("supprime l'image de Cloudinary et de la DB", async () => {
    // 1. On simule que l'image existe en DB et appartient au bon utilisateur
    const existing = { id: 1, publicId: "docknotes/user-1/abc", userId: "user-1" };
    mockDb.image.findUnique.mockResolvedValue(existing);
    // 2. On simule la suppression réussie sur Cloudinary
    mockDestroy.mockResolvedValue({ result: "ok" });
    // 3. On simule la suppression réussie en DB
    mockDb.image.delete.mockResolvedValue({});

    const result = await imageService.deleteImage(1, "user-1");

    // Vérifie que Cloudinary a bien supprimé le fichier avec le bon publicId
    expect(mockDestroy).toHaveBeenCalledWith("docknotes/user-1/abc");
    // Vérifie que l'enregistrement a été supprimé en DB
    expect(mockDb.image.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBe(true);
  });

  // Test de sécurité : on ne peut pas supprimer l'image d'un autre utilisateur
  it("retourne null si l'image n'appartient pas a l'utilisateur", async () => {
    mockDb.image.findUnique.mockResolvedValue({ id: 1, userId: "user-2", publicId: "x" });

    const result = await imageService.deleteImage(1, "user-1");

    expect(result).toBeNull();
    // Cloudinary ne doit PAS être appelé (pas de suppression non autorisée)
    expect(mockDestroy).not.toHaveBeenCalled();
  });

  it("retourne null si l'image n'existe pas", async () => {
    mockDb.image.findUnique.mockResolvedValue(null);

    const result = await imageService.deleteImage(999, "user-1");

    expect(result).toBeNull();
  });
});
