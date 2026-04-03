import type { Category } from "../interfaces/category.interface";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const getCategories = async () : Promise<Category[]> => {
    const res = await fetch(`${API_URL}/categories`)
    if(!res.ok) throw new Error("Erreur lors de la récupération des catégories")
    return res.json();
};

export const createCategory = async (category : {name : string; description? : string}) : Promise<Category> => {
    const res = await fetch(`${API_URL}/categories`, {
        method : "POST",
        headers : { "Content-Type" : "application/json"},
        body : JSON.stringify(category)
    });
    if(!res.ok) throw new Error("Erreur lors de la création de la catégorie");
    return res.json()
}