import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { categorySchema } from "../lib/schemas";
import type { CategoryFormData } from "../lib/schemas";

interface Props {
    onSubmit: (data: { name: string; description?: string }) => void;
    onClose: () => void;
}

export const CategoryForm = ({ onSubmit, onClose }: Props) => {
    const { register, handleSubmit, formState: { errors, isValid } } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "", description: "" },
        mode: "onChange",
    });

    const onFormSubmit = (data: CategoryFormData) => {
        onSubmit({
            name: data.name.trim(),
            description: data.description?.trim() || undefined,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit(onFormSubmit)}
                className="bg-white rounded-2xl p-8 w-full max-w-md flex flex-col gap-5 shadow-xl"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Nouvelle catégorie</h2>
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
                        placeholder="Nom de la catégorie"
                        {...register("name")}
                        maxLength={50}
                        className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 w-full"
                    />
                    {errors.name && (
                        <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <input
                        type="text"
                        placeholder="Description (optionnel)"
                        {...register("description")}
                        maxLength={255}
                        className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 w-full"
                    />
                    {errors.description && (
                        <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
                    )}
                </div>

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
                        className="px-4 py-2 rounded-lg bg-black text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Créer
                    </button>
                </div>
            </form>
        </div>
    );
};
