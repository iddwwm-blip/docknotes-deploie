import { z } from "zod/v4";

export const createNoteSchema = z.object({
    title : z.string().min(1, "Le titre est obligatoire").max(50, "Le titre doit faire moins de 51 caractères"),
    content : z.string().min(1, "Le contenu est obligatoire").max(500),
    color : z.string().max(50).optional(),
    isFavorite : z.boolean().optional(),
    category_id : z.number().int().positive().nullable().optional()
});

export const updateNoteSchema = z.object({
    title : z.string().min(1, "Le titre est obligatoire").max(50, "Le titre doit faire moins de 51 caractères"),
    content : z.string().min(1, "Le contenu est obligatoire").max(500),
    color : z.string().max(50).optional(),
    isFavorite : z.boolean().optional(),
    category_id : z.number().int().positive().nullable().optional()   
});

export const patchNoteSchema = z.object({
    title : z.string().min(1, "Le titre est obligatoire").max(50, "Le titre doit faire moins de 51 caractères").optional(),
    content : z.string().min(1, "Le contenu est obligatoire").max(500).optional(),
    color : z.string().max(50).optional(),
    date : z.coerce.date().optional(),
    isFavorite : z.boolean().optional(),
    category_id : z.number().int().positive().nullable().optional()
});

export type CreateNoteDto = z.infer<typeof createNoteSchema>;
export type UpdateNoteDto = z.infer<typeof updateNoteSchema>;
export type PatchNoteDto = z.infer<typeof patchNoteSchema>;