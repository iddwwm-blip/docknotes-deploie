import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { noteSchema } from "../lib/schemas";
import type { NoteFormData } from "../lib/schemas";
import type { Category } from "@/interfaces/category.interface";

interface Props {
    color: string;
    categories: Category[];
    onSubmit: (data: { title: string; content: string; color: string; category_id?: number | null }) => void;
    onClose: () => void;
}

export const NoteForm = ({ color, categories, onSubmit, onClose }: Props) => {
    const { register, handleSubmit, formState: { errors, isValid } } = useForm<NoteFormData>({
        resolver: zodResolver(noteSchema),
        defaultValues: { title: "", content: "", categoryId: "" },
        mode: "onChange",
    });

    const onFormSubmit = (data: NoteFormData) => {
        onSubmit({
            title: data.title.trim(),
            content: data.content.trim(),
            color,
            category_id: data.categoryId ? Number(data.categoryId) : null,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit(onFormSubmit)}
                className="bg-white rounded-2xl p-8 w-full max-w-md flex flex-col gap-5 shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-5 h-5 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <h2 className="text-xl font-semibold">Nouvelle note</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer text-gray-500 hover:text-black"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div>
                    <input
                        type="text"
                        placeholder="Titre"
                        {...register("title")}
                        maxLength={50}
                        className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 w-full"
                    />
                    {errors.title && (
                        <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
                    )}
                </div>

                <div>
                    <textarea
                        placeholder="Contenu de la note..."
                        {...register("content")}
                        maxLength={500}
                        rows={5}
                        className="border border-gray-300 rounded-lg px-4 py-2 outline-none resize-none focus:border-gray-500 w-full"
                    />
                    {errors.content && (
                        <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>
                    )}
                </div>

                <select
                    {...register("categoryId")}
                    className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 bg-white"
                >
                    <option value="">Sans catégorie</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 cursor-pointer hover:bg-gray-100"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={!isValid}
                        className="px-4 py-2 rounded-lg text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ backgroundColor: color }}
                    >
                        Créer
                    </button>
                </div>
            </form>
        </div>
    );
};
