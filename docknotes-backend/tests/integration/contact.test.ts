import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

/**
 * Mocks de toutes les dépendances externes.
 * Même si ce test ne concerne que le contact, on doit mocker TOUTES les dépendances
 * car l'app Express les charge toutes au démarrage (import de toutes les routes).
 */

// Mock minimal de la DB (pas de tables utilisées pour le contact)
vi.mock("@/lib/db", () => ({
  default: { $connect: vi.fn() },
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

// On mock directement le service contact (au lieu de mocker Resend)
// car on veut tester la route + le contrôleur, pas le service lui-même
vi.mock("@/services/contact.service", () => ({
  sendContactEmail: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class { emails = { send: vi.fn() }; },
}));

import app from "@/app";
import * as contactService from "@/services/contact.service";

// Cast pour pouvoir contrôler le comportement de sendContactEmail
const mockSendEmail = contactService.sendContactEmail as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS HTTP : POST /contact ====================
describe("POST /contact", () => {
  // Test : Envoi réussi d'un message de contact
  it("retourne 200 avec message de succes", async () => {
    // undefined = le service a réussi (pas de valeur de retour)
    mockSendEmail.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/contact")
      .send({
        name: "Jean Dupont",
        email: "jean@test.com",
        message: "Bonjour, j'ai une question.",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Message envoyé avec succès");
    // Vérifie que le service a bien été appelé avec les données du formulaire
    expect(mockSendEmail).toHaveBeenCalledWith({
      name: "Jean Dupont",
      email: "jean@test.com",
      message: "Bonjour, j'ai une question.",
    });
  });

  // Tests de validation : l'API doit rejeter les données invalides AVANT d'appeler le service
  it("retourne 400 si le nom est manquant", async () => {
    const res = await request(app)
      .post("/contact")
      .send({
        email: "jean@test.com",
        message: "Hello",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Données invalides");
    // Le service ne doit PAS avoir été appelé
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("retourne 400 si l'email est invalide", async () => {
    const res = await request(app)
      .post("/contact")
      .send({
        name: "Jean",
        email: "not-an-email",
        message: "Hello",
      });

    expect(res.status).toBe(400);
  });

  it("retourne 400 si le message est vide", async () => {
    const res = await request(app)
      .post("/contact")
      .send({
        name: "Jean",
        email: "jean@test.com",
        message: "",
      });

    expect(res.status).toBe(400);
  });

  it("retourne 400 si le body est vide", async () => {
    const res = await request(app)
      .post("/contact")
      .send({});

    expect(res.status).toBe(400);
  });

  // Test : Vérifie la gestion d'erreur quand le service email tombe en panne
  it("retourne 500 si l'envoi d'email echoue", async () => {
    mockSendEmail.mockRejectedValue(new Error("Email service down"));

    const res = await request(app)
      .post("/contact")
      .send({
        name: "Jean",
        email: "jean@test.com",
        message: "Hello",
      });

    // 500 = Internal Server Error
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Erreur lors de l'envoi du message");
  });
});
