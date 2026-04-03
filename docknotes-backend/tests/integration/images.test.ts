import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

/**
 * Mocks de toutes les dépendances externes.
 * Les tests d'intégration images nécessitent : DB, Auth, Cloudinary
 */

// Mock de Prisma avec les méthodes de la table "image"
vi.mock("@/lib/db", () => ({
  default: {
    image: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $connect: vi.fn(),
  },
}));

// Mock de l'authentification (pour simuler des utilisateurs connectés/déconnectés)
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("better-auth/node", () => ({
  toNodeHandler: vi.fn(() => vi.fn()),
  fromNodeHeaders: vi.fn((h) => h),
}));

// Mock de Cloudinary pour simuler l'upload et la suppression d'images
vi.mock("@/lib/cloudinary", () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn(),
    },
  },
}));

vi.mock("resend", () => ({
  Resend: class { emails = { send: vi.fn() }; },
}));

import app from "@/app";
import db from "@/lib/db";
import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

// Cast des mocks pour accéder aux méthodes de contrôle
// "as unknown as" est nécessaire car TypeScript ne sait pas que ces fonctions sont des mocks
const mockGetSession = auth.api.getSession as unknown as ReturnType<typeof vi.fn>;
const mockUploadStream = cloudinary.uploader.upload_stream as ReturnType<typeof vi.fn>;
const mockDestroy = cloudinary.uploader.destroy as ReturnType<typeof vi.fn>;

const mockDb = db as unknown as {
  image: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

/**
 * Fonction utilitaire pour simuler un utilisateur connecté.
 * getSession retourne un objet { user: { id: ... } } quand l'utilisateur est authentifié,
 * ou null quand il ne l'est pas.
 */
function authenticateUser(userId = "user-1") {
  mockGetSession.mockResolvedValue({ user: { id: userId } });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS HTTP : GET /images ====================
describe("GET /images", () => {
  // Test : Les routes images nécessitent une authentification
  it("retourne 401 si non authentifie", async () => {
    // null = pas de session = utilisateur non connecté
    mockGetSession.mockResolvedValue(null);

    const res = await request(app).get("/images");

    // 401 = Unauthorized (non authentifié)
    expect(res.status).toBe(401);
  });

  it("retourne 200 avec les images de l'utilisateur", async () => {
    authenticateUser(); // Simule un utilisateur connecté
    const images = [
      { id: 1, url: "https://cdn.test.com/img.webp", publicId: "abc", userId: "user-1" },
    ];
    mockDb.image.findMany.mockResolvedValue(images);

    const res = await request(app).get("/images");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(images);
  });
});

// ==================== TESTS HTTP : POST /images ====================
describe("POST /images", () => {
  it("retourne 401 si non authentifie", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await request(app)
      .post("/images")
      // .attach() simule l'envoi d'un fichier (comme un formulaire multipart)
      // "image" = nom du champ, Buffer = données du fichier, "test.png" = nom du fichier
      .attach("image", Buffer.from("fake-image"), "test.png");

    expect(res.status).toBe(401);
  });

  it("retourne 201 apres upload reussi", async () => {
    authenticateUser();
    // Simule la réponse de Cloudinary après un upload réussi
    const fakeCloudinaryResult = {
      secure_url: "https://cdn.test.com/img.webp",
      public_id: "docknotes/user-1/abc",
    };

    // mockImplementation contrôle exactement ce que fait la fonction.
    // upload_stream de Cloudinary prend (options, callback) et retourne un stream.
    // On appelle le callback avec (null, résultat) pour simuler un succès.
    mockUploadStream.mockImplementation((_opts: unknown, callback: Function) => {
      callback(null, fakeCloudinaryResult);
      return { end: vi.fn() };
    });

    const createdImage = {
      id: 1,
      url: fakeCloudinaryResult.secure_url,
      publicId: fakeCloudinaryResult.public_id,
      userId: "user-1",
    };
    mockDb.image.create.mockResolvedValue(createdImage);

    const res = await request(app)
      .post("/images")
      .attach("image", Buffer.from("fake-image-data"), "photo.png");

    expect(res.status).toBe(201);
    expect(res.body).toEqual(createdImage);
  });

  // Test : Vérifie le comportement quand on envoie la requête SANS fichier
  it("retourne 400 si aucun fichier n'est envoye", async () => {
    authenticateUser();

    // Pas de .attach() = pas de fichier envoyé
    const res = await request(app).post("/images");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Aucune image fournie");
  });
});

// ==================== TESTS HTTP : DELETE /images/:id ====================
describe("DELETE /images/:id", () => {
  it("retourne 204 apres suppression reussie", async () => {
    authenticateUser();
    // Simule que l'image existe et appartient à l'utilisateur
    mockDb.image.findUnique.mockResolvedValue({
      id: 1, publicId: "docknotes/user-1/abc", userId: "user-1",
    });
    mockDestroy.mockResolvedValue({ result: "ok" });
    mockDb.image.delete.mockResolvedValue({});

    const res = await request(app).delete("/images/1");

    expect(res.status).toBe(204);
    // Vérifie que Cloudinary a supprimé le bon fichier
    expect(mockDestroy).toHaveBeenCalledWith("docknotes/user-1/abc");
  });

  it("retourne 404 si l'image n'existe pas", async () => {
    authenticateUser();
    mockDb.image.findUnique.mockResolvedValue(null);

    const res = await request(app).delete("/images/999");

    expect(res.status).toBe(404);
  });

  // Test de sécurité : un utilisateur ne peut pas supprimer l'image d'un autre
  it("retourne 404 si l'image appartient a un autre utilisateur", async () => {
    authenticateUser("user-1");
    // L'image appartient à "user-2", pas à "user-1"
    mockDb.image.findUnique.mockResolvedValue({
      id: 1, publicId: "abc", userId: "user-2",
    });

    const res = await request(app).delete("/images/1");

    // On retourne 404 (et pas 403) pour ne pas révéler l'existence de la ressource
    expect(res.status).toBe(404);
  });

  it("retourne 401 si non authentifie", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await request(app).delete("/images/1");

    expect(res.status).toBe(401);
  });
});
