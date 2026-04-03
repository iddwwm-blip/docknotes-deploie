import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Trash2, Loader2 } from "lucide-react";
import { getUserImages, uploadImage, deleteImage } from "@/api/image";
import type { Image } from "@/interfaces/image.interface";

export const GalleryPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [images, setImages] = useState<Image[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const fetchImages = async () => {
        try {
            const data = await getUserImages();
            setImages(data);
        } catch {
            setError("Erreur lors du chargement des images");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        e.target.value = "";

        if (!file.type.startsWith("image/")) {
            setError("Type de fichier non supporté. Utilisez une image.");
            return;
        }

        setError("");
        setUploading(true);

        try {
            await uploadImage(file);
            await fetchImages();
        } catch {
            setError("Erreur lors de l'upload de l'image");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        setDeletingId(id);
        setError("");

        try {
            await deleteImage(id);
            setImages((prev) => prev.filter((img) => img.id !== id));
        } catch {
            setError("Erreur lors de la suppression de l'image");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex-1 p-10 overflow-y-scroll">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => navigate("/")}
                            className="flex items-center gap-2 text-black/60 hover:text-black cursor-pointer w-fit"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm">Retour aux notes</span>
                        </button>
                        <h1 className="text-2xl font-bold">Galerie</h1>
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-black text-white rounded-lg px-4 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        <span>{uploading ? "Upload en cours..." : "Ajouter une image"}</span>
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                {loading && (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                )}

                {!loading && images.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Upload className="w-12 h-12 mb-4" />
                        <p>Aucune image dans votre galerie</p>
                        <p className="text-sm mt-1">Cliquez sur "Ajouter une image" pour commencer</p>
                    </div>
                )}

                {!loading && images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map((image) => (
                            <div
                                key={image.id}
                                className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200"
                            >
                                <img
                                    src={image.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                <button
                                    onClick={() => handleDelete(image.id)}
                                    disabled={deletingId === image.id}
                                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-50"
                                >
                                    {deletingId === image.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                                    ) : (
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
