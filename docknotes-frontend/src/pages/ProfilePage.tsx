import { useState } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { LogOut, ArrowLeft, Check } from "lucide-react";
import { authClient } from "../lib/auth-client";
import type { AppContext } from "../App";

export const ProfilePage = () => {
    const { handleSignOut } = useOutletContext<AppContext>();
    const { slug } = useParams();
    const navigate = useNavigate();
    const { data: session } = authClient.useSession();

    const [name, setName] = useState(session?.user.name || "");
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    if (!session || session.user.id !== slug) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Profil introuvable</p>
            </div>
        );
    }

    const hasChanged = name.trim() !== session.user.name;

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        setError("");
        setSuccess(false);

        const { error: updateError } = await authClient.updateUser({
            name: name.trim(),
        });

        if (updateError) {
            setError(updateError.message || "Erreur lors de la mise a jour");
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        }

        setSaving(false);
    };

    return (
        <div className="flex-1 p-10 overflow-y-scroll">
            <div className="max-w-md mx-auto flex flex-col gap-8">
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-black/60 hover:text-black cursor-pointer w-fit"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Retour aux notes</span>
                </button>

                <div>
                    <h1 className="text-2xl font-bold">Profil</h1>
                    <p className="text-sm text-gray-500 mt-1">{session.user.email}</p>
                </div>

                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                {success && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        Nom mis a jour
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="text-sm font-medium">Nom</label>
                    <div className="flex gap-3">
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500"
                        />
                        <button
                            onClick={handleSave}
                            disabled={!hasChanged || saving || !name.trim()}
                            className="bg-black text-white rounded-lg px-4 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? "..." : "Sauvegarder"}
                        </button>
                    </div>
                </div>

                <hr className="border-gray-200" />

                <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-500 hover:text-red-700 cursor-pointer w-fit"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Se deconnecter</span>
                </button>
            </div>
        </div>
    );
};
