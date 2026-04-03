import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { sendContactMessage } from "@/api/contact";
import { contactSchema } from "../lib/schemas";
import type { ContactFormData } from "../lib/schemas";

export const ContactPage = () => {
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: { name: "", email: "", message: "" },
    });

    const onFormSubmit = async (data: ContactFormData) => {
        setError("");
        setSuccess(false);
        setLoading(true);

        try {
            await sendContactMessage({
                name: data.name.trim(),
                email: data.email.trim(),
                message: data.message.trim(),
            });
            setSuccess(true);
            reset();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du message");
        }

        setLoading(false);
    };

    return (
        <div className="h-screen flex items-center justify-center bg-zinc-100">
            <form
                onSubmit={handleSubmit(onFormSubmit)}
                className="bg-white rounded-2xl p-10 w-full max-w-sm flex flex-col gap-5 shadow-lg"
            >
                <Link
                    to="/"
                    className="flex items-center gap-2 text-gray-400 hover:text-black w-fit"
                >
                    <ArrowLeft size={16} />
                    <span className="text-sm">Retour</span>
                </Link>

                <h1 className="text-2xl font-bold text-center">Contact</h1>
                <p className="text-sm text-center text-gray-500">
                    Envoyer un message
                </p>

                {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                {success && (
                    <p className="text-sm text-green-600 text-center">
                        Message envoyé avec succès !
                    </p>
                )}

                <div>
                    <input
                        type="text"
                        placeholder="Nom"
                        {...register("name")}
                        className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 w-full"
                    />
                    {errors.name && (
                        <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        {...register("email")}
                        className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 w-full"
                    />
                    {errors.email && (
                        <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                    )}
                </div>

                <div>
                    <textarea
                        placeholder="Votre message"
                        {...register("message")}
                        rows={5}
                        className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 resize-none w-full"
                    />
                    {errors.message && (
                        <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white rounded-lg px-4 py-2 cursor-pointer disabled:opacity-50"
                >
                    {loading ? "..." : "Envoyer"}
                </button>
            </form>
        </div>
    );
};