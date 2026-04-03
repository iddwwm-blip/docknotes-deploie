import { useEffect, useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { authClient } from "./lib/auth-client"
import { Navbar } from "@/components/Navbar"
import { NoteForm } from "@/components/NoteForm"
import { EditNoteForm } from "./components/EditNoteForm"
import { CategoryForm } from "./components/CategoryForm"
import { getNotes, searchNotes, createNote, updateNote, deleteNote} from "@/api/note"
import { getCategories, createCategory } from "@/api/category"
import type { Note } from "@/interfaces/notes.interface"
import type { Category } from "@/interfaces/category.interface"

export interface AppContext {
  notes: Note[]
  categories: Category[]
  handleSearch: (query: string) => void
  handleUpdateNote: (id: number, data: { title?: string; content?: string }) => void
  handleDeleteNote: (id: number) => void
  setEditingNote: (note: Note | null) => void
  handleSignOut: () => void
}

function App() {
  const { data: session, isPending } = authClient.useSession()

  const [notes, setNotes] = useState<Note[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [selectedColor, setSelectedColor] = useState("#3B82F6")

  const fetchNotes = async () => {
    const data = await getNotes()
    setNotes(data)
  }

  const fetchCategories = async () => {
    const data = await getCategories()
    setCategories(data)
  }

  useEffect(() => {
    if (session) {
      fetchNotes()
      fetchCategories()
    }
  }, [session])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    setIsFormOpen(true)
  }

  const handleCreateNote = async (data: { title: string; content: string; color: string; category_id?: number | null }) => {
    await createNote(data)
    setIsFormOpen(false)
    await fetchNotes()
  }

  const handleUpdateNote = async (id: number, data: { title?: string; content?: string }) => {
    await updateNote(id, data)
    await fetchNotes()
  }

  const handleDeleteNote = async (id: number) => {
    await deleteNote(id)
    await fetchNotes()
  }

  const handleEditNote = async (id: number, data: { title: string; content: string; category_id: number | null }) => {
    await updateNote(id, { ...data, date: new Date().toISOString() })
    setEditingNote(null)
    await fetchNotes()
  }

  const handleCreateCategory = async (data: { name: string; description?: string }) => {
    await createCategory(data)
    setIsCategoryFormOpen(false)
    await fetchCategories()
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      await fetchNotes()
      return
    }
    const data = await searchNotes(query)
    setNotes(data)
  }

  const handleSignOut = async () => {
    await authClient.signOut()
    setNotes([])
    setCategories([])
  }

  if (isPending) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  const context: AppContext = {
    notes,
    categories,
    handleSearch,
    handleUpdateNote,
    handleDeleteNote,
    setEditingNote,
    handleSignOut,
  }

  return (
    <main className="h-screen flex overflow-hidden">
      <Navbar
        onColorSelect={handleColorSelect}
        onOpenCategoryForm={() => setIsCategoryFormOpen(true)}
        userName={session.user.name}
        userId={session.user.id}
      />
      <Outlet context={context} />
      {isFormOpen && (
        <NoteForm
          color={selectedColor}
          categories={categories}
          onSubmit={handleCreateNote}
          onClose={() => setIsFormOpen(false)}
        />
      )}
      {editingNote && (
        <EditNoteForm
          note={editingNote}
          categories={categories}
          onSubmit={handleEditNote}
          onClose={() => setEditingNote(null)}
        />
      )}
      {isCategoryFormOpen && (
        <CategoryForm
          onSubmit={handleCreateCategory}
          onClose={() => setIsCategoryFormOpen(false)}
        />
      )}
    </main>
  )
}

export default App
