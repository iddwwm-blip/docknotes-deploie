import type { Image } from "../interfaces/image.interface";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getUserImages = async () : Promise<Image[]> => {
    const res = await fetch(`${API_URL}/images`, {credentials: "include"});
    if(!res.ok) throw new Error("Erreur lors de la récupération des images");
    return res.json();
}

export const uploadImage = async (file : File) : Promise<Image[]> => {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${API_URL}/images`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erreur lors de l'upload de l'image");
    }
    return res.json();
};

export const deleteImage = async (id : number) : Promise<void> => {
  const res = await fetch(`${API_URL}/images/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression de l'image");    
}