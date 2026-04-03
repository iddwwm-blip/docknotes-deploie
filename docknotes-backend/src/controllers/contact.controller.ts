import { Request, Response } from "express";
import { createContactSchema } from "@/dtos/contact.dto";
import * as contactService from "@/services/contact.service";

/**
 * POST / — Envoie un message de contact par email.
 */
export async function send(req: Request, res: Response): Promise<void> {
  try {
    const parsed = createContactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Données invalides", errors: parsed.error.issues });
      return;
    }

    await contactService.sendContactEmail(parsed.data);
    res.json({ message: "Message envoyé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'envoi du message", error });
  }
}
