import { Request, Response } from "express";
import { createNoteSchema, updateNoteSchema, patchNoteSchema } from "@/dtos/note.dto";
import * as noteService from "@/services/note.service";

export const getAll = async (req: Request, res: Response) => {
    try {
        const search = typeof req.query.title === "string" ? req.query.title : undefined;
        const notes = await noteService.getAllNotes(req.userId!, search);
        res.json(notes);
    } catch (error) {
        res.status(500).json({message : "Erreur server", error});
    };
};

export const getById = async (req : Request, res : Response) => {
    try {
        const note = await noteService.getNoteById(Number(req.params.id), req.userId!);
        if(!note){
            return res.status(400).json({message : "Note not found"})
        };
        res.json(note);
    } catch (error) {
        res.status(500).json({message : "Erreur server", error});
    };
};

export const create = async (req : Request, res : Response) => {
    try {
        const parsed = createNoteSchema.safeParse(req.body);
        if(!parsed.success){
            return res.status(400).json({message : "Données invalides", errors : parsed.error.issues});
        }
        const note = await noteService.createNote(req.userId! , parsed.data);
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({message : "Erreur server", error});    
    };
};

export const update = async (req : Request, res : Response) => {
    try {
        const parsed = updateNoteSchema.safeParse(req.body);
        if(!parsed.success){
            return res.status(400).json({message : "Données invalides", errors : parsed.error.issues});
        }
        const note = await noteService.updateNote(Number(req.params.id), req.userId!, parsed.data);
        if(!note){
            return res.status(404).json({message : "Note not found"});
        }  
        res.json(note)   
    } catch (error) {
       res.status(500).json({message : "Erreur server", error}); 
    };
};

export const patch = async (req : Request, res : Response) => {
    try {
        const parsed = patchNoteSchema.safeParse(req.body);
        if(!parsed.success){
            return res.status(400).json({message : "Données invalides", errors : parsed.error.issues});
        };
        
        if (Object.keys(parsed.data).length === 0){
            return res.status(400).json({
                message : "Aucun champs à modifier"
            })
        };

        const note = await noteService.patchNote(Number(req.params.id), req.userId!, parsed.data);
        if(!note){
            return res.status(404).json({message : "Note not found"});
        } 
        res.json(note)
    } catch (error) {
        res.status(500).json({message : "Erreur server", error}); 
    };
};

export const remove = async (req : Request, res : Response) => {
    try {
        const result = await noteService.deleteNote(Number(req.params.id), req.userId!)
        if(!result){
           return res.status(404).json({message : "Note not found"}); 
        }
        res.status(204).send()
    } catch (error) {
        res.status(500).json({message : "Erreur server", error});
    }
}