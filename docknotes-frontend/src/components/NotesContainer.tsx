import { Note } from "./Note"
import type { Note as NoteType } from "@/interfaces/notes.interface"

interface Props {
    notes: NoteType[];
    onUpdate: (id: number, data: { content?: string }) => void;
    onDelete: (id: number) => void;
    onEdit: (note: NoteType) => void;
}

export const NotesContainer = ({ notes, onUpdate, onDelete, onEdit }: Props) => {
    return (
        <div className="px-10 grid gap-15">
            <h2 className="text-6xl font-bold">Notes</h2>
            <div className="grid grid-cols-5 gap-15">
                {notes.map((note) => (
                    <Note
                        key={note.id}
                        note={note}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </div>
    )
}
