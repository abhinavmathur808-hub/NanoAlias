import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Shield, LogOut, LayoutDashboard, Menu, X, Sun, Moon } from "lucide-react";
import nanoaliasLogo from "../assets/nanoalias_logo.png";
import { useState } from "react";
import { useLogoutMutation } from "../store/usersApiSlice";
import { logout } from "../store/authSlice";
import useTheme from "../hooks/useTheme";

export default function Navbar() {
    const { userInfo, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [logoutApi] = useLogoutMutation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isDark, toggleTheme } = useTheme();

    const handleLogout = async () => {
        try {
            await logoutApi().unwrap();
        } catch {
            /* proceed even if backend call fails */
        }
        dispatch(logout());
        navigate("/");
        setMobileOpen(false);
    };

    const closeMobile = () => setMobileOpen(false);

    return (
        <nav
            id="navbar"
            className="sticky top-0 z-50 border-b backdrop-blur-xl"
            style={{ background: 'var(--nav-bg)', borderColor: 'var(--border-soft)' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 group"
                        onClick={closeMobile}
                    >
                        <img
                            src={nanoaliasLogo}
                            alt="NanoAlias logo"
                            className="h-10 w-auto"
                        />
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden sm:flex items-center gap-3">
                        {/* Theme toggle */}
                        <button
                            onClick={toggleTheme}
                            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                            title={isDark ? "Light mode" : "Dark mode"}
                            className="btn-press p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/10 transition"
                        >
                            {isDark ? <Sun size={17} /> : <Moon size={17} />}
                        </button>

                        {token && userInfo ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-[#7dd3fc] hover:bg-slate-700/50 transition"
                                >
                                    <LayoutDashboard size={15} />
                                    Dashboard
                                </Link>
                                {userInfo.role === "admin" && (
                                    <Link
                                        to="/admin"
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition"
                                    >
                                        <Shield size={15} />
                                        Admin
                                    </Link>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                                >
                                    <LogOut size={15} />
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-5 py-2 rounded-lg text-sm font-semibold text-white hover:bg-[#E24A29] transition-colors duration-200 shadow-lg shadow-[#FF5A36]/20"
                                    style={{ background: '#FF5A36', color: '#fff' }}
                                >
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile: theme toggle + hamburger */}
                    <div className="sm:hidden flex items-center gap-1">
                        <button
                            onClick={toggleTheme}
                            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                            className="btn-press p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-white/10 transition"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile dropdown */}
            {mobileOpen && (
                <div className="sm:hidden border-t backdrop-blur-xl px-4 pb-4 pt-2 space-y-1 anim-slide-down" style={{ borderColor: 'var(--border-soft)', background: 'var(--nav-bg-solid)' }}>

                    {token && userInfo ? (
                        <>
                            <Link
                                to="/dashboard"
                                onClick={closeMobile}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-[#7dd3fc] hover:bg-slate-700/50 transition"
                            >
                                <LayoutDashboard size={16} />
                                Dashboard
                            </Link>
                            {userInfo.role === "admin" && (
                                <Link
                                    to="/admin"
                                    onClick={closeMobile}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition"
                                >
                                    <Shield size={16} />
                                    Admin
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                onClick={closeMobile}
                                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:text-[#7dd3fc] hover:bg-slate-700/50 transition"
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                onClick={closeMobile}
                                className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-center text-white hover:bg-[#E24A29] transition-colors duration-200 shadow-lg shadow-[#FF5A36]/20"
                                style={{ background: '#FF5A36', color: '#fff' }}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
