import { z } from "zod";

// ============================================
// Auth - Inscription
// ============================================

export const signUpSchema = z
    .object({
        name: z.string().min(1, "Le nom est requis"),
        email: z.string().email("Email invalide"),
        password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
        confirmPassword: z.string().min(1, "La confirmation est requise"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirmPassword"],
    });

export type SignUpFormData = z.infer<typeof signUpSchema>;

// ============================================
// Auth - Connexion
// ============================================

export const signInSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(1, "Le mot de passe est requis"),
});

export type SignInFormData = z.infer<typeof signInSchema>;

// ============================================
// Note (création et édition)
// ============================================

export const noteSchema = z.object({
    title: z
        .string()
        .min(1, "Le titre est requis")
        .max(50, "Le titre ne peut pas dépasser 50 caractères"),
    content: z
        .string()
        .min(1, "Le contenu est requis")
        .max(500, "Le contenu ne peut pas dépasser 500 caractères"),
    categoryId: z.string(),
});

export type NoteFormData = z.infer<typeof noteSchema>;

// ============================================
// Catégorie
// ============================================

export const categorySchema = z.object({
    name: z
        .string()
        .min(1, "Le nom est requis")
        .max(50, "Le nom ne peut pas dépasser 50 caractères"),
    description: z
        .string()
        .max(255, "La description ne peut pas dépasser 255 caractères")
        .optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// ============================================
// Contact
// ============================================

export const contactSchema = z.object({
    name: z.string().min(1, "Le nom est requis"),
    email: z.string().email("Email invalide"),
    message: z.string().min(1, "Le message est requis"),
});

export type ContactFormData = z.infer<typeof contactSchema>;
