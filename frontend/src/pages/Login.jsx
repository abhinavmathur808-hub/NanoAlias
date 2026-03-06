import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import { useLoginMutation, useGoogleLoginMutation } from "../store/usersApiSlice";
import { setCredentials } from "../store/authSlice";
import nanoaliasLogo from "../assets/nanoalias_logo.png";



export default function Login() {
    const { token } = useSelector((state) => state.auth);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [view, setView] = useState("login");
    const [resetEmail, setResetEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [login, { isLoading }] = useLoginMutation();
    const [googleLoginMutation] = useGoogleLoginMutation();

    useEffect(() => {
        if (token) navigate("/", { replace: true });
    }, [token, navigate]);

    const isLengthValid = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
    const isPasswordValid = isLengthValid && hasUppercase && hasNumber && hasSpecialChar;

    const submitHandler = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await login({ email, password }).unwrap();
            dispatch(setCredentials({ user: res.user, token: res.token }));
            navigate("/", { replace: true });
        } catch (err) {
            setError(err?.data?.message || "Login failed. Please try again.");
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await googleLoginMutation({ tokenId: credentialResponse.credential }).unwrap();
            dispatch(setCredentials({ user: res.user, token: res.token }));
            navigate("/dashboard");
        } catch (err) {
            setError(err?.data?.message || "Google login failed. Please try again.");
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setForgotLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to send reset code.");
            setView("forgot-reset");
        } catch (err) {
            setError(err.message);
        } finally {
            setForgotLoading(false);
        }
    };

    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setResetLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: resetEmail, otp, newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Password reset failed.");
            setOtp("");
            setNewPassword("");
            setResetEmail("");
            setSuccess("Password reset successful! You can now sign in.");
            setView("login");
        } catch (err) {
            setError(err.message);
        } finally {
            setResetLoading(false);
        }
    };

    const goToLogin = () => {
        setView("login");
        setError("");
        setOtp("");
        setNewPassword("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#000000' }}>
            <div className="w-full max-w-md">
                {/* Branding */}
                <div className="text-center mb-8">
                    <img
                        src={nanoaliasLogo}
                        alt="NanoAlias logo"
                        className="h-12 w-auto mx-auto mb-3"
                    />
                    <p className="mt-2 text-slate-400 text-sm">
                        Shorten. Track. Dominate.
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-8 shadow-2xl backdrop-blur-sm" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>

                    {/* ─── LOGIN VIEW ─── */}
                    {view === "login" && (
                        <>
                            <h2 className="text-xl font-semibold mb-6" style={{ color: '#e6eef8' }}>
                                Welcome back
                            </h2>

                            {error && (
                                <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="mb-5 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {success}
                                </div>
                            )}

                            <form onSubmit={submitHandler} className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-slate-300 mb-1.5"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition"
                                        style={{ background: '#000000', border: '1px solid rgba(26,26,26,0.6)' }}
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label
                                            htmlFor="password"
                                            className="block text-sm font-medium text-slate-300"
                                        >
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => { setView("forgot-email"); setError(""); setSuccess(""); }}
                                            className="text-xs text-[#CEB372] hover:text-[#e0c97f] transition"
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition"
                                            style={{ background: '#000000', border: '1px solid rgba(26,26,26,0.6)' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm transition"
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 mt-6 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-white"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg
                                                className="animate-spin h-5 w-5"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                                />
                                            </svg>
                                            Signing in…
                                        </span>
                                    ) : (
                                        "Sign In"
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-700" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#0b0b0b] px-3 text-slate-500">
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            {/* Google button */}
                            <div className="flex justify-center w-full">
                                <GoogleLogin
                                    onSuccess={(credentialResponse) => handleGoogleSuccess(credentialResponse)}
                                    onError={() => setError("Google Login Failed")}
                                    theme="filled_black"
                                    size="large"
                                    shape="rectangular"
                                    text="continue_with"
                                />
                            </div>
                        </>
                    )}

                    {/* ─── FORGOT PASSWORD: EMAIL STEP ─── */}
                    {view === "forgot-email" && (
                        <>
                            <div className="text-center mb-6">
                                <div className="h-14 w-14 rounded-full bg-[#CEB372]/10 flex items-center justify-center mx-auto mb-4">
                                    <svg className="h-7 w-7 text-[#CEB372]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-1">Forgot password?</h2>
                                <p className="text-sm text-gray-400">
                                    Enter your email and we'll send a 6-digit reset code.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-400 mb-1.5">
                                        Email address
                                    </label>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        required
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition"
                                        style={{ background: '#000000', border: '1px solid rgba(26,26,26,0.6)' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading || !resetEmail.trim()}
                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-white"
                                >
                                    {forgotLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                            </svg>
                                            Sending code…
                                        </span>
                                    ) : (
                                        "Send Reset Code"
                                    )}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={goToLogin}
                                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-white transition-colors"
                            >
                                ← Back to login
                            </button>
                        </>
                    )}

                    {/* ─── FORGOT PASSWORD: RESET STEP ─── */}
                    {view === "forgot-reset" && (
                        <>
                            <div className="text-center mb-6">
                                <div className="h-14 w-14 rounded-full bg-[#E2242A]/10 flex items-center justify-center mx-auto mb-4">
                                    <svg className="h-7 w-7 text-[#E2242A]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-1">Enter reset code</h2>
                                <p className="text-sm text-gray-400">
                                    We sent a 6-digit code to <span className="text-[#CEB372] font-medium">{resetEmail}</span>
                                </p>
                            </div>

                            {error && (
                                <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="reset-otp" className="block text-sm font-medium text-gray-400 mb-2 text-center">
                                        Verification Code
                                    </label>
                                    <input
                                        id="reset-otp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                        placeholder="000000"
                                        autoComplete="one-time-code"
                                        className="w-full px-4 py-4 rounded-lg text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:border-[#CEB372]/50 focus:ring-1 focus:ring-[#CEB372]/30 transition-all duration-200"
                                        style={{ background: '#000000', border: '1px solid rgba(26,26,26,0.6)' }}
                                    />
                                    <p className="mt-2 text-xs text-gray-500 text-center">
                                        Code expires in 5 minutes
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-400 mb-1.5">
                                        New Password
                                    </label>
                                    <input
                                        id="new-password"
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={6}
                                        className="w-full px-4 py-3 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition"
                                        style={{ background: '#000000', border: '1px solid rgba(26,26,26,0.6)' }}
                                    />
                                    <ul className="mt-2 space-y-1">
                                        {[
                                            { label: "At least 8 characters", pass: isLengthValid },
                                            { label: "One uppercase letter", pass: hasUppercase },
                                            { label: "One number", pass: hasNumber },
                                            { label: "One special character", pass: hasSpecialChar },
                                        ].map((c) => (
                                            <li
                                                key={c.label}
                                                className={`flex items-center gap-1.5 text-xs ${c.pass ? "text-emerald-400" : "text-gray-500"}`}
                                            >
                                                <span className="text-[10px]">{c.pass ? "✓" : "○"}</span>
                                                {c.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    type="submit"
                                    disabled={resetLoading || otp.length !== 6 || !isPasswordValid}
                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-white"
                                >
                                    {resetLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                            </svg>
                                            Resetting…
                                        </span>
                                    ) : (
                                        "Reset Password"
                                    )}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={goToLogin}
                                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-white transition-colors"
                            >
                                ← Back to login
                            </button>
                        </>
                    )}
                </div>

                {/* Footer link */}
                {view === "login" && (
                    <p className="mt-6 text-center text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/register"
                            className="font-medium text-[#CEB372] hover:text-[#e0c97f] transition"
                        >
                            Sign up
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
