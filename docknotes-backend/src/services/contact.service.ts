import { Resend } from "resend";
import type { CreateContactDto } from "@/dtos/contact.dto";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envoie un email de contact via Resend.
 */
export async function sendContactEmail(data: CreateContactDto) {
  const contactEmail = process.env.CONTACT_EMAIL;
  if (!contactEmail) {
    throw new Error("CONTACT_EMAIL non configuré");
  }

  await resend.emails.send({
    from: "Docknotes <onboarding@resend.dev>",
    to: contactEmail,
    subject: `Contact Docknotes - ${data.name}`,
    html: `
      <h2>Nouveau message de contact</h2>
      <p><strong>Nom :</strong> ${data.name}</p>
      <p><strong>Email :</strong> ${data.email}</p>
      <hr />
      <p>${data.message.replace(/\n/g, "<br />")}</p>
    `,
  });
}
