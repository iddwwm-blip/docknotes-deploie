const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const sendContactMessage = async (message : {name : string, email : string, message : string}) : Promise<void> => {
    const res = await fetch(`${API_URL}/contact`, {
        method : "POST",
        headers : {"Content-Type" : "application/json"},
        body : JSON.stringify(message)
    });
    if(!res.ok){
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Erreur lors de l'envoi du message");
    }
}