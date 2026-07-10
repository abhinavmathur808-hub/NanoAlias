import { Link } from "react-router-dom";
import nanoaliasLogo from "../assets/nanoalias_logo.png";

export default function NotFound() {
    return (
        <div id="not-found-page" className="min-h-screen flex flex-col items-center justify-center anim-fade-in" style={{ background: 'var(--bg)' }}>
            <img src={nanoaliasLogo} alt="NanoAlias logo" className="h-10 w-auto mb-8 opacity-50 float-y" />
            <h1 className="text-7xl font-extrabold gradient-text-animated">404</h1>
            <p className="mt-4 text-lg" style={{ color: 'var(--muted)' }}>Page not found.</p>
            <Link to="/" className="btn-press mt-6 text-sm font-medium px-5 py-2.5 rounded-lg transition hover:opacity-90" style={{ background: 'var(--accent-1)', color: 'var(--bg)' }}>Go home</Link>
        </div>
    );
}
