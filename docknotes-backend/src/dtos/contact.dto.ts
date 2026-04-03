import { z } from "zod/v4";

/**
 * DTO pour l'envoi d'un message de contact (POST).
 */
export const createContactSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").trim(),
  email: z.email("Email invalide").trim(),
  message: z.string().min(1, "Le message est obligatoire").trim(),
});

export type CreateContactDto = z.infer<typeof createContactSchema>;
