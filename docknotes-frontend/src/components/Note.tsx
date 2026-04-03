import { useState } from "react";
import { Trash2, Save, Pencil } from "lucide-react";
import type { Note as NoteType } from "@/interfaces/notes.interface";

interface Props {
    note: NoteType;
    onUpdate: (id: number, data: { content?: string }) => void;
    onDelete: (id: number) => void;
    onEdit: (note: NoteType) => void;
}

export const Note = ({ note, onUpdate, onDelete, onEdit }: Props) => {
    const [content, setContent] = useState(note.content || "");
    const hasChanged = content !== (note.content || "");

    const formatDate = (date: string | null) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div
            className="rounded-2xl px-5 py-6 flex flex-col h-70"
            style={{ backgroundColor: note.color || "#FFFFFF" }}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm truncate flex-1">{note.title}</p>
                <div className="flex gap-1">
                    {hasChanged && (
                        <button
                            onClick={() => onUpdate(note.id, { content })}
                            className="cursor-pointer text-black/60 hover:text-black"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(note)}
                        className="cursor-pointer text-black/60 hover:text-black"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="cursor-pointer text-black/60 hover:text-black"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écrivez ici..."
                maxLength={500}
                className="flex-1 outline-none resize-none placeholder-black/50 bg-transparent"
            />
            <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-black/60">{formatDate(note.date)}</p>
                {note.category && (
                    <span className="text-xs bg-black/10 rounded-full px-2 py-0.5 truncate max-w-24">
                        {note.category.name}
                    </span>
                )}
            </div>
        </div>
    );
};
