// Imports des outils de test Vitest et des types Express
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import * as contactController from "@/controllers/contact.controller";

/**
 * On mock le service contact pour ne pas envoyer de vrais emails pendant les tests.
 */
vi.mock("@/services/contact.service", () => ({
  sendContactEmail: vi.fn(),
}));

import * as contactService from "@/services/contact.service";

// Cast pour pouvoir utiliser les méthodes de mock (.mockResolvedValue, etc.)
const mockService = contactService as unknown as {
  sendContactEmail: ReturnType<typeof vi.fn>;
};

// Crée un faux objet Request Express
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    ...overrides,
  } as unknown as Request;
}

// Crée un faux objet Response Express
function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

// Nettoyage des mocks avant chaque test
beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS : Envoi de message de contact ====================
describe("contactController.send", () => {
  // Test : Vérifie que l'envoi fonctionne avec des données valides
  it("envoie le message et retourne un succes", async () => {
    // undefined = le service a réussi sans retourner de valeur
    mockService.sendContactEmail.mockResolvedValue(undefined);
    const req = mockReq({
      body: {
        name: "Jean Dupont",
        email: "jean@test.com",
        message: "Bonjour",
      },
    });
    const res = mockRes();

    await contactController.send(req, res);

    // Vérifie que le service a été appelé avec les bonnes données
    expect(mockService.sendContactEmail).toHaveBeenCalledWith({
      name: "Jean Dupont",
      email: "jean@test.com",
      message: "Bonjour",
    });
    expect(res.json).toHaveBeenCalledWith({ message: "Message envoyé avec succès" });
  });

  // Test : Vérifie que la validation rejette un email au mauvais format
  it("retourne 400 si l'email est invalide", async () => {
    const req = mockReq({
      body: { name: "Jean", email: "invalid", message: "Hello" },
    });
    const res = mockRes();

    await contactController.send(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    // Le service ne doit pas être appelé si la validation échoue
    expect(mockService.sendContactEmail).not.toHaveBeenCalled();
  });

  // Test : Vérifie le rejet d'un body complètement vide
  it("retourne 400 si le body est vide", async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await contactController.send(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  // Test : Vérifie que le contrôleur gère les erreurs du service d'envoi d'email
  it("retourne 500 si le service echoue", async () => {
    // mockRejectedValue simule une erreur dans le service (ex: Resend est en panne)
    mockService.sendContactEmail.mockRejectedValue(new Error("Email failed"));
    const req = mockReq({
      body: {
        name: "Jean",
        email: "jean@test.com",
        message: "Hello",
      },
    });
    const res = mockRes();

    await contactController.send(req, res);

    // 500 = erreur interne du serveur
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
