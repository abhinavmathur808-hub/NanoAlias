import { Link } from "react-router-dom";
import { Flame } from "lucide-react";

export default function Expired() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
            <div className="w-full max-w-md text-center">
                <div className="bg-surface-light border border-slate-700/60 rounded-2xl p-10 shadow-2xl shadow-indigo-950/20 backdrop-blur-sm">
                    <div className="h-16 w-16 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                        <Flame size={32} className="text-red-400" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-2">
                        Link Expired
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                        This link has self-destructed, expired, or been disabled by its owner
                        and is no longer accessible.
                    </p>

                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-primary to-primary-dark text-white font-semibold hover:opacity-90 transition"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
