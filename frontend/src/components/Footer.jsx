import nanoaliasLogo from "../assets/nanoalias_logo.png";

export default function Footer() {
    return (
        <footer id="footer" className="py-6 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-slate-500">
                <img
                    src={nanoaliasLogo}
                    alt="NanoAlias logo"
                    className="h-5 w-auto opacity-60"
                />
                <span>&copy; {new Date().getFullYear()} NanoAlias. All rights reserved.</span>
            </div>
        </footer>
    );
}
