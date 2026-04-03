import db from "@/lib/db";
import type { CreateNoteDto, UpdateNoteDto, PatchNoteDto } from "@/dtos/note.dto";
                                                    
export const getAllNotes = async (userId : string, search?: string) => {
    return db.note.findMany({
        where: {
            userId,
            ...(search ? { content : {contains : search}} : {})
        },
        orderBy : {date : "desc"},
        include: {category : {select : {name : true, description: true}}}
    });
};

export const getNoteById = async (id : number, userId: string) => {
    const note = await db.note.findUnique({
        where : {id},
        include: {category : {select : {name : true, description: true}}}
    });

    if(!note || note.userId !== userId) return null;
    return note
};

export const createNote = async (userId : string, d : CreateNoteDto) => {
    return db.note.create({
        data : {
            title : d.title,
            content : d.content,
            color : d.color ?? "#fc03c6",
            date : new Date(),
            isFavorite : d.isFavorite ?? false,
            category_id : d.category_id ?? null,
            userId
        }
    });
};

export const updateNote = async (id: number, userId : string, d : UpdateNoteDto) => {
    const existing = await db.note.findUnique({where : {id}});
    if(!existing || existing.userId !== userId) return null;

    return db.note.update({
        where : {id},
        data : {
            title : d.title,
            content : d.content,
            color : d.color,
            isFavorite : d.isFavorite ?? false,
            category_id : d.category_id ?? null
        }
    });
};

export const patchNote = async (id: number, userId: string, data : PatchNoteDto) => {
    const existing = await db.note.findUnique({where : {id}});
    if(!existing || existing.userId !== userId) return null;

    return db.note.update({
        where : {id},
        data
    })
};

export const deleteNote = async (id: number, userId : string) => {
    const existing = await db.note.findUnique({where : {id}});
    if(!existing || existing.userId !== userId) return null;
    
    await db.note.delete({where : {id}});
    return true;
}