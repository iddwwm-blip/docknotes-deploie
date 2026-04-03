import { useOutletContext } from "react-router-dom";
import { SearchBar } from "@/components/SearchBar";
import { NotesContainer } from "@/components/NotesContainer";
import type { AppContext } from "../App";

export const HomePage = () => {
    const { notes, handleSearch, handleUpdateNote, handleDeleteNote, setEditingNote } = useOutletContext<AppContext>();

    return (
        <div className="flex-1 p-10 overflow-y-scroll">
            <div className="flex flex-col gap-30">
                <div className="flex justify-center">
                    <SearchBar onSearch={handleSearch} />
                </div>
                <NotesContainer
                    notes={notes}
                    onUpdate={handleUpdateNote}
                    onDelete={handleDeleteNote}
                    onEdit={(note) => setEditingNote(note)}
                />
            </div>
        </div>
    );
};
