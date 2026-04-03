import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Mock de Resend (service d'envoi d'emails).
 * Resend est une classe, donc on la mock comme un constructeur (class).
 * On exporte aussi __mockSend pour pouvoir récupérer le mock depuis les tests.
 */
vi.mock("resend", () => {
  const mockSend = vi.fn();
  return {
    // La classe Resend mockée : quand on fait new Resend(), on obtient un objet
    // avec emails.send qui est notre fonction mock
    Resend: class {
      emails = { send: mockSend };
    },
    // On exporte le mock pour pouvoir le récupérer dans les tests
    __mockSend: mockSend,
  };
});

import * as contactService from "@/services/contact.service";

/**
 * Récupère la fonction mock "send" depuis le module mocké.
 * vi.importMock() permet d'accéder au module tel qu'il a été mocké,
 * y compris les propriétés supplémentaires qu'on a ajoutées (__mockSend)
 */
async function getMockSend() {
  const mod = await vi.importMock<{ __mockSend: ReturnType<typeof vi.fn> }>("resend");
  return mod.__mockSend;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ==================== TESTS : Envoi d'email de contact ====================
describe("contactService.sendContactEmail", () => {
  it("envoie un email avec les bonnes donnees", async () => {
    const mockSend = await getMockSend();
    // vi.stubEnv() permet de simuler une variable d'environnement
    // (on évite de dépendre de la vraie config pendant les tests)
    vi.stubEnv("CONTACT_EMAIL", "admin@test.com");
    mockSend.mockResolvedValue({ id: "email-1" });

    await contactService.sendContactEmail({
      name: "Jean Dupont",
      email: "jean@test.com",
      message: "Bonjour\nComment ca va ?",
    });

    // expect.objectContaining() vérifie une partie de l'objet passé à send()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Docknotes <onboarding@resend.dev>",
        to: "admin@test.com",
        subject: "Contact Docknotes - Jean Dupont",
      })
    );

    // On récupère les arguments du 1er appel pour vérifier le contenu HTML
    // mock.calls[0][0] = premier appel, premier argument
    const callArgs = mockSend.mock.calls[0][0];
    expect(callArgs.html).toContain("Jean Dupont");
    expect(callArgs.html).toContain("jean@test.com");
    // Les sauts de ligne (\n) doivent être convertis en <br /> pour le HTML
    expect(callArgs.html).toContain("<br />");

    // On nettoie les variables d'environnement stubées
    vi.unstubAllEnvs();
  });

  // Test : Vérifie que le service lance une erreur si la variable d'environnement manque
  it("lance une erreur si CONTACT_EMAIL n'est pas configure", async () => {
    vi.stubEnv("CONTACT_EMAIL", "");
    // On supprime aussi la variable pour simuler un environnement non configuré
    delete process.env.CONTACT_EMAIL;

    // rejects.toThrow vérifie que la promesse est rejetée avec ce message d'erreur
    await expect(
      contactService.sendContactEmail({
        name: "Test",
        email: "test@test.com",
        message: "Hello",
      })
    ).rejects.toThrow("CONTACT_EMAIL non configuré");

    vi.unstubAllEnvs();
  });
});
