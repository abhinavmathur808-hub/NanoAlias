import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Lock, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import nanoaliasLogo from "../assets/nanoalias_logo.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Unlock() {
    const { shortCode } = useParams();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch(`${API_URL}/urls/${shortCode}/unlock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Incorrect password. Please try again.");
                setIsLoading(false);
                return;
            }

            window.location.href = data.originalUrl;
        } catch {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
            <div className="w-full max-w-md">
                {/* Branding */}
                <div className="text-center mb-8">
                    <Link to="/">
                        <img
                            src={nanoaliasLogo}
                            alt="NanoAlias logo"
                            className="h-12 w-auto mx-auto mb-3"
                        />
                    </Link>
                    <p className="mt-2 text-slate-400 text-sm">
                        Shorten. Track. Dominate.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-surface-light border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-indigo-950/20 backdrop-blur-sm">
                    <div className="flex flex-col items-center mb-6">
                        <div className="h-14 w-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                            <ShieldCheck size={28} className="text-amber-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-white">
                            Password Protected
                        </h2>
                        <p className="mt-2 text-slate-400 text-sm text-center">
                            This link is protected. Enter the password to continue.
                        </p>
                    </div>

                    <div className="mb-5 px-4 py-3 rounded-lg bg-slate-800/60 border border-slate-700/40">
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
                            Short Code
                        </p>
                        <p className="text-sm text-primary-light font-mono font-medium">
                            /{shortCode}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-slate-300 mb-1.5"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <Lock size={16} />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    required
                                    autoFocus
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter link password"
                                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary transition"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-primary-dark text-white font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 focus:ring-offset-surface-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Verifying…
                                </>
                            ) : (
                                <>
                                    <Lock size={18} />
                                    Unlock Link
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Don&apos;t have the password?{" "}
                    <Link
                        to="/"
                        className="font-medium text-primary-light hover:text-primary transition"
                    >
                        Go home
                    </Link>
                </p>
            </div>
        </div>
    );
}
