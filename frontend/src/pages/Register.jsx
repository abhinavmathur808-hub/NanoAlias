import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { GoogleLogin } from "@react-oauth/google";
import { useRegisterMutation, useVerifyOtpMutation, useGoogleLoginMutation } from "../store/usersApiSlice";
import { setCredentials } from "../store/authSlice";
import nanoaliasLogo from "../assets/nanoalias_logo.png";

function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
}

const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
const strengthColors = ["text-red-400", "text-amber-400", "text-purple-400", "text-emerald-400"];
const barColors = ["bg-red-400", "bg-amber-400", "bg-purple-400", "bg-emerald-400"];

function PasswordStrengthMeter({ password }) {
    const strength = getPasswordStrength(password);
    if (!password) return null;

    return (
        <div className="mt-2">
            <div className="flex gap-1 mb-1.5">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength ? barColors[strength - 1] : "bg-white/5"
                            }`}
                    />
                ))}
            </div>
            <p
                className={`text-xs font-medium ${strengthColors[strength - 1] || "text-gray-500"}`}
                role="status"
                aria-live="polite"
            >
                {strengthLabels[strength - 1] || "Too short"}
            </p>
        </div>
    );
}

function PasswordChecklist({ password }) {
    if (!password) return null;
    const checks = [
        { label: "At least 8 characters", pass: password.length >= 8 },
        { label: "One uppercase letter", pass: /[A-Z]/.test(password) },
        { label: "One number", pass: /[0-9]/.test(password) },
        { label: "One special character", pass: /[^A-Za-z0-9]/.test(password) },
    ];
    return (
        <ul className="mt-2 space-y-1" aria-label="Password requirements">
            {checks.map((c) => (
                <li
                    key={c.label}
                    className={`flex items-center gap-1.5 text-xs ${c.pass ? "text-emerald-400" : "text-gray-500"}`}
                >
                    <span className="text-[10px]">{c.pass ? "✓" : "○"}</span>
                    {c.label}
                </li>
            ))}
        </ul>
    );
}

export default function Register() {
    const { token } = useSelector((state) => state.auth);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState("");

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [register, { isLoading }] = useRegisterMutation();
    const [verifyOtpMutation, { isLoading: isVerifying }] = useVerifyOtpMutation();
    const [googleLoginMutation] = useGoogleLoginMutation();

    useEffect(() => {
        if (token) navigate("/", { replace: true });
    }, [token, navigate]);

    const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordStrength = getPasswordStrength(password);

    const isFormValid =
        name.trim().length > 0 &&
        emailValid &&
        passwordStrength >= 2 &&
        passwordsMatch;

    const submitHandler = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await register({ name, email, password }).unwrap();
            setStep(2);
        } catch (err) {
            setError(err?.data?.message || "Registration failed. Please try again.");
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const res = await verifyOtpMutation({ email, otp }).unwrap();
            dispatch(setCredentials({ user: res.user, token: res.token }));
            navigate("/", { replace: true });
        } catch (err) {
            setError(err?.data?.message || "Verification failed. Please try again.");
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

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-8 w-full">
            <div className="w-full max-w-md">

                {/* Logo + tagline */}
                <div className="mb-8">
                    <img
                        src={nanoaliasLogo}
                        alt="NanoAlias logo"
                        className="h-10 sm:h-12 w-auto mb-3"
                    />
                    <p className="text-sm text-gray-400">
                        Shorten. Track. Dominate.
                    </p>
                </div>

                {/* Card */}
                <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl p-8">

                    {/* ─── STEP 1: Registration Form ─── */}
                    {step === 1 && (
                        <>
                            <h1 className="text-2xl sm:text-[28px] font-semibold text-white mb-1">
                                Create your account
                            </h1>
                            <p className="text-sm text-gray-400 mb-6">
                                Start shortening links in seconds — free forever.
                            </p>

                            {error && (
                                <div
                                    className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
                                    role="alert"
                                >
                                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={submitHandler} className="space-y-4" noValidate>
                                {/* Full Name */}
                                <div>
                                    <label htmlFor="reg-name" className="block text-sm font-medium text-gray-400 mb-1.5">
                                        Full Name
                                    </label>
                                    <input
                                        id="reg-name"
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        aria-label="Full name"
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-200"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="reg-email" className="block text-sm font-medium text-gray-400 mb-1.5">
                                        Email
                                    </label>
                                    <input
                                        id="reg-email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        aria-label="Email address"
                                        aria-describedby="email-hint"
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-200"
                                    />
                                    {email && !emailValid && (
                                        <p id="email-hint" className="mt-1 text-xs text-red-400">
                                            Please enter a valid email address.
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="reg-password" className="block text-sm font-medium text-gray-400 mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="reg-password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            aria-label="Password"
                                            aria-describedby="pw-strength pw-checklist"
                                            className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 pr-14 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-300 transition-colors"
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? "Hide" : "Show"}
                                        </button>
                                    </div>
                                    <div id="pw-strength">
                                        <PasswordStrengthMeter password={password} />
                                    </div>
                                    <div id="pw-checklist">
                                        <PasswordChecklist password={password} />
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-400 mb-1.5">
                                        Confirm Password
                                    </label>
                                    <input
                                        id="reg-confirm"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        aria-label="Confirm password"
                                        aria-describedby="confirm-hint"
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-200"
                                    />
                                    {confirmPassword && !passwordsMatch && (
                                        <p id="confirm-hint" className="mt-1 text-xs text-red-400">
                                            Passwords do not match.
                                        </p>
                                    )}
                                    {passwordsMatch && (
                                        <p id="confirm-hint" className="mt-1 text-xs text-emerald-400">
                                            ✓ Passwords match
                                        </p>
                                    )}
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isLoading || !isFormValid}
                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 mt-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-white"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                            </svg>
                                            Sending code…
                                        </span>
                                    ) : (
                                        "Create Account"
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-[#0A0A0A] px-3 text-gray-500">
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            {/* Google */}
                            <div className="flex justify-center w-full">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError("Google Login Failed")}
                                    theme="filled_black"
                                    size="large"
                                    shape="rectangular"
                                    text="continue_with"
                                />
                            </div>
                        </>
                    )}

                    {/* ─── STEP 2: OTP Verification ─── */}
                    {step === 2 && (
                        <>
                            <div className="text-center mb-6">
                                <div className="h-14 w-14 rounded-full bg-[#E2242A]/10 flex items-center justify-center mx-auto mb-4">
                                    <svg className="h-7 w-7 text-[#E2242A]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-1">Check your email</h2>
                                <p className="text-sm text-gray-400">
                                    We sent a 6-digit code to <span className="text-[#CEB372] font-medium">{email}</span>
                                </p>
                            </div>

                            {error && (
                                <div
                                    className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2"
                                    role="alert"
                                >
                                    <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4m0 4h.01" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleVerifyOTP} className="space-y-5">
                                <div>
                                    <label htmlFor="otp-input" className="block text-sm font-medium text-gray-400 mb-2 text-center">
                                        Verification Code
                                    </label>
                                    <input
                                        id="otp-input"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        required
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                        placeholder="000000"
                                        autoComplete="one-time-code"
                                        aria-label="6-digit verification code"
                                        className="w-full bg-black border border-white/10 rounded-lg px-4 py-4 text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-gray-600 focus:outline-none focus:border-[#CEB372]/50 focus:ring-1 focus:ring-[#CEB372]/30 transition-all duration-200"
                                    />
                                    <p className="mt-2 text-xs text-gray-500 text-center">
                                        Code expires in 5 minutes
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isVerifying || otp.length !== 6}
                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-white"
                                >
                                    {isVerifying ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                            </svg>
                                            Verifying…
                                        </span>
                                    ) : (
                                        "Verify Account"
                                    )}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={() => { setStep(1); setOtp(""); setError(""); }}
                                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-white transition-colors"
                            >
                                ← Back to registration
                            </button>
                        </>
                    )}
                </div>

                {/* Footer link */}
                {step === 1 && (
                    <p className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-white font-semibold hover:underline transition"
                        >
                            Sign in
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
