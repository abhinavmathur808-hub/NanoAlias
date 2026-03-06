import { Link } from "react-router-dom";
import nanoaliasLogo from "../assets/nanoalias_logo.png";

export default function NotFound() {
    return (
        <div id="not-found-page" className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#000000' }}>
            <img src={nanoaliasLogo} alt="NanoAlias logo" className="h-10 w-auto mb-8 opacity-50" />
            <h1 className="text-7xl font-extrabold" style={{ backgroundImage: 'linear-gradient(90deg, #7dd3fc, #9b7bff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
            <p className="mt-4 text-lg" style={{ color: '#9aa7b8' }}>Page not found.</p>
            <Link to="/" className="mt-6 text-sm font-medium px-5 py-2.5 rounded-lg transition hover:opacity-90" style={{ background: '#7dd3fc', color: '#000000' }}>Go home</Link>
        </div>
    );
}
