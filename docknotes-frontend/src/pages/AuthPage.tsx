import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "../lib/auth-client";
import { signUpSchema, signInSchema } from "../lib/schemas";
import type { SignUpFormData, SignInFormData } from "../lib/schemas";

export const AuthPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const signUpForm = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
        defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    });

    const signInForm = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSignUp = async (data: SignUpFormData) => {
        setError("");
        setLoading(true);

        const { error } = await authClient.signUp.email({
            name: data.name,
            email: data.email,
            password: data.password,
        });
        if (error) {
            setError(error.message || "Erreur lors de l'inscription");
            setLoading(false);
            return;
        }
        const { error: signInError } = await authClient.signIn.email({
            email: data.email,
            password: data.password,
        });
        if (signInError) {
            setError(signInError.message || "Compte créé mais erreur lors de la connexion");
            setLoading(false);
            return;
        }

        setLoading(false);
        window.location.href = "/";
    };

    const onSignIn = async (data: SignInFormData) => {
        setError("");
        setLoading(true);

        const { error } = await authClient.signIn.email({
            email: data.email,
            password: data.password,
        });
        if (error) {
            setError(error.message || "Erreur lors de la connexion");
            setLoading(false);
            return;
        }

        setLoading(false);
        window.location.href = "/";
    };

    const handleSocialSignIn = async (provider: "google" | "github") => {
        setError("");
        await authClient.signIn.social({
            provider,
            callbackURL: window.location.origin + "/",
        });
    };

    const switchMode = () => {
        setIsSignUp(!isSignUp);
        setError("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        signUpForm.reset();
        signInForm.reset();
    };

    return (
        <div className="h-screen flex items-center justify-center bg-zinc-100">
            {isSignUp ? (
                <form
                    onSubmit={signUpForm.handleSubmit(onSignUp)}
                    className="bg-white rounded-2xl p-10 w-full max-w-sm flex flex-col gap-5 shadow-lg"
                >
                    <h1 className="text-2xl font-bold text-center">Docknotes</h1>
                    <p className="text-sm text-center text-gray-500">Créer un compte</p>

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <div>
                        <input
                            type="text"
                            placeholder="Nom"
                            {...signUpForm.register("name")}
                            className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 w-full"
                        />
                        {signUpForm.formState.errors.name && (
                            <p className="text-xs text-red-500 mt-1">{signUpForm.formState.errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            {...signUpForm.register("email")}
                            className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 w-full"
                        />
                        {signUpForm.formState.errors.email && (
                            <p className="text-xs text-red-500 mt-1">{signUpForm.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Mot de passe"
                                {...signUpForm.register("password")}
                                className="border border-gray-300 rounded-lg px-4 py-2 pr-10 outline-none focus:border-gray-500 w-full"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {signUpForm.formState.errors.password && (
                            <p className="text-xs text-red-500 mt-1">{signUpForm.formState.errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirmer le mot de passe"
                                {...signUpForm.register("confirmPassword")}
                                className={`border rounded-lg px-4 py-2 pr-10 outline-none focus:border-gray-500 w-full ${
                                    signUpForm.formState.errors.confirmPassword
                                        ? "border-red-400"
                                        : "border-gray-300"
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {signUpForm.formState.errors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1">{signUpForm.formState.errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white rounded-lg px-4 py-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "..." : "S'inscrire"}
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-300" />
                        <span className="text-xs text-gray-400">ou</span>
                        <div className="h-px flex-1 bg-gray-300" />
                    </div>

                    <button
                        type="button"
                        onClick={() => handleSocialSignIn("google")}
                        className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continuer avec Google
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialSignIn("github")}
                        className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        Continuer avec GitHub
                    </button>

                    <button
                        type="button"
                        onClick={switchMode}
                        className="text-sm text-gray-500 hover:text-black cursor-pointer"
                    >
                        Déjà un compte ? Se connecter
                    </button>
                </form>
            ) : (
                <form
                    onSubmit={signInForm.handleSubmit(onSignIn)}
                    className="bg-white rounded-2xl p-10 w-full max-w-sm flex flex-col gap-5 shadow-lg"
                >
                    <h1 className="text-2xl font-bold text-center">Docknotes</h1>
                    <p className="text-sm text-center text-gray-500">Se connecter</p>

                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}

                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            {...signInForm.register("email")}
                            className="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:border-gray-500 w-full"
                        />
                        {signInForm.formState.errors.email && (
                            <p className="text-xs text-red-500 mt-1">{signInForm.formState.errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Mot de passe"
                                {...signInForm.register("password")}
                                className="border border-gray-300 rounded-lg px-4 py-2 pr-10 outline-none focus:border-gray-500 w-full"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {signInForm.formState.errors.password && (
                            <p className="text-xs text-red-500 mt-1">{signInForm.formState.errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-black text-white rounded-lg px-4 py-2 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "..." : "Se connecter"}
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-300" />
                        <span className="text-xs text-gray-400">ou</span>
                        <div className="h-px flex-1 bg-gray-300" />
                    </div>

                    <button
                        type="button"
                        onClick={() => handleSocialSignIn("google")}
                        className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Continuer avec Google
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSocialSignIn("github")}
                        className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        Continuer avec GitHub
                    </button>

                    <button
                        type="button"
                        onClick={switchMode}
                        className="text-sm text-gray-500 hover:text-black cursor-pointer"
                    >
                        Pas de compte ? S'inscrire
                    </button>
                </form>
            )}
        </div>
    );
};
