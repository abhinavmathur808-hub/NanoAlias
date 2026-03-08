import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { useSelector } from "react-redux";
import {
    Copy,
    ExternalLink,
    BarChart3,
    Trash2,
    Plus,
    ChevronDown,
    ChevronUp,
    Link2,
    MousePointerClick,
    Globe,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Search,
    QrCode,
    Flame,
    Eye,
    EyeOff,
    Check,
    X,
    List,
    LayoutGrid,
    Clock,
    Lock,
    Hash,
    Zap,
    ArrowRight,
    Download,
    Palette,
    Shield,
    Share2,
} from "lucide-react";
import { useGetMyUrlsQuery, useCreateUrlMutation, useDeleteUrlMutation } from "../store/urlSlice";
import QrModal from "../components/QrModal";

const BASE_URL = "https://nanoalias.com";

const mono = { fontFamily: "'JetBrains Mono', monospace" };

const C = {
    bg: "#000000",
    surface: "#0b0b0b",
    card: "#0b0b0b",
    text: "#e6eef8",
    muted: "#9aa7b8",
    primary: "#7dd3fc",
    accent: "#ff6fb5",
    accent1: "#7dd3fc",
    accent2: "#ff6fb5",
    accent3: "#7efc6a",
    accent4: "#ffb86b",
    accent5: "#9b7bff",
    success: "#34d399",
    warn: "#f59e0b",
    border: "#1a1a1a",
    glow: "rgba(125,211,252,0.06)",
    glowSecondary: "rgba(255,111,181,0.06)",
    gradient: "linear-gradient(90deg, #7dd3fc, #9b7bff)",
};

function Toast({ message, visible, type = "success" }) {
    const accentColor = type === "error" ? C.warn : C.success;
    const iconColor = type === "error" ? "#f87171" : C.success;
    return (
        <div
            role="status"
            aria-live="polite"
            className={`toast-container fixed bottom-6 right-6 z-[100] pl-5 pr-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all duration-300 motion-reduce:transition-none ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                }`}
            style={{ '--toast-accent': accentColor, color: C.text }}
        >
            <span className="flex items-center gap-2">
                <Check size={14} style={{ color: iconColor }} />
                {message}
            </span>
        </div>
    );
}

function DeleteModal({ url, onConfirm, onClose }) {
    const [typed, setTyped] = useState("");
    const alias = url?.customAlias || url?.shortCode || "";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={onClose}
        >
            <div
                className="relative rounded-2xl p-6 shadow-2xl w-full max-w-sm"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg transition hover:bg-white/10" style={{ color: C.muted }}>
                    <X size={18} />
                </button>
                <h3 className="text-lg font-semibold mb-2" style={{ color: C.text }}>Delete Link</h3>
                <p className="text-sm mb-4" style={{ color: C.muted }}>
                    Type <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: C.bg, color: C.accent, ...mono }}>{alias}</code> to confirm deletion.
                </p>
                <input
                    type="text"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={alias}
                    aria-label="Type alias to confirm deletion"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none mb-4 transition-all focus:ring-2"
                    style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, ...mono }}
                    onFocus={(e) => e.target.style.borderColor = "#f87171"}
                    onBlur={(e) => e.target.style.borderColor = C.border}
                />
                <div className="flex gap-3">
                    <button
                        onClick={() => { if (typed === alias) onConfirm(); }}
                        disabled={typed !== alias}
                        className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ background: typed === alias ? "#ef4444" : "#7f1d1d", color: "white" }}
                    >
                        Delete permanently
                    </button>
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium transition" style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

function AnimatedCounter({ value, duration = 800 }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const target = typeof value === "number" ? value : parseInt(value, 10) || 0;
        if (target === 0) { setDisplay(0); return; }
        let start = 0;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * target));
            if (progress < 1) ref.current = requestAnimationFrame(animate);
        };
        ref.current = requestAnimationFrame(animate);
        return () => { if (ref.current) cancelAnimationFrame(ref.current); };
    }, [value, duration]);

    return <>{display.toLocaleString()}</>;
}

function MiniSparkline({ color }) {
    const d = "M0,12 L4,9 L8,11 L12,6 L16,8 L20,3 L24,5 L28,2 L32,4 L36,1";
    return (
        <svg width="36" height="14" viewBox="0 0 36 14" fill="none" className="ml-auto shrink-0 opacity-70">
            <path d={d} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function StatTile({ icon: Icon, label, value, color, sparkColor }) {
    return (
        <div className="stat-bar flex items-center gap-4" style={{ '--stat-accent': color }}>
            <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                <Icon size={22} style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wider font-medium" style={{ color: C.muted }}>{label}</p>
                <div className="flex items-center gap-3">
                    <p className="text-2xl font-bold mt-0.5" style={{ color: C.text }}>
                        <AnimatedCounter value={value} />
                    </p>
                    <MiniSparkline color={sparkColor || C.accent5} />
                </div>
            </div>
        </div>
    );
}

function CopyBtn({ text, onToast }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try { await navigator.clipboard.writeText(text); } catch { /* blocked */ }
        setCopied(true);
        onToast("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} aria-label="Copy to clipboard" className="p-1.5 rounded-md transition hover:bg-white/10" style={{ color: copied ? C.success : C.muted }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
    );
}

function StatusBadge({ status, expiresAt, oneTimeUse }) {
    const isExpired = status === "disabled" || (expiresAt && new Date(expiresAt) < new Date());
    const label = isExpired ? "Expired" : status === "archived" ? "Archived" : oneTimeUse ? "Burn" : "Active";
    const color = isExpired || status === "archived" ? "#f87171" : oneTimeUse ? C.warn : C.success;
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
            {oneTimeUse && !isExpired && <Flame size={10} />}
            {label}
        </span>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.auth);
    const { data, isLoading, isError } = useGetMyUrlsQuery();
    const [createUrl, { isLoading: isCreating }] = useCreateUrlMutation();
    const [deleteUrl] = useDeleteUrlMutation();

    const [longUrl, setLongUrl] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [customAlias, setCustomAlias] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [expiresAt, setExpiresAt] = useState("");
    const [expiryPreset, setExpiryPreset] = useState("never");
    const [oneTimeUse, setOneTimeUse] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createSuccess, setCreateSuccess] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [qrUrl, setQrUrl] = useState(null);
    const [viewMode, setViewMode] = useState("list");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: "" });

    // Social share dropdown
    const [openShareId, setOpenShareId] = useState(null);
    const shareBtnRef = useRef(null);
    const shareMenuRef = useRef(null);
    const toggleShare = (id, btnEl) => {
        setOpenShareId((prev) => (prev === id ? null : id));
        shareBtnRef.current = btnEl || null;
    };

    // QR customization
    const [showQrPreview, setShowQrPreview] = useState(false);
    const [qrSize, setQrSize] = useState("M");
    const [qrCustomSize, setQrCustomSize] = useState("");
    const [qrFg, setQrFg] = useState("#0f172a");
    const [qrBg, setQrBg] = useState("#ffffff");
    const [qrEc, setQrEc] = useState("H");
    const [qrMargin, setQrMargin] = useState(true);
    const qrCanvasRef = useRef(null);

    const qrSizes = { S: 128, M: 200, L: 300, XL: 400 };
    const activeQrSize = qrCustomSize ? parseInt(qrCustomSize, 10) || 200 : qrSizes[qrSize];

    // Close share dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (
                shareMenuRef.current && !shareMenuRef.current.contains(e.target) &&
                shareBtnRef.current && !shareBtnRef.current.contains(e.target)
            )
                setOpenShareId(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Desktop media query
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 640px)");
        setIsDesktop(mq.matches);
        const handler = (e) => setIsDesktop(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    // Scanability check
    const scanWarning = useMemo(() => {
        const hexToRgb = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return [r, g, b];
        };
        const luminance = ([r, g, b]) => {
            const a = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
            return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
        };
        const l1 = luminance(hexToRgb(qrFg));
        const l2 = luminance(hexToRgb(qrBg));
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        if (ratio < 3) return "Low contrast — QR may be unscannable.";
        if (ratio < 4.5) return "Moderate contrast — test with multiple scanners.";
        return null;
    }, [qrFg, qrBg]);

    const handleQrDownload = useCallback(() => {
        const canvas = qrCanvasRef.current?.querySelector("canvas");
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = `nanoalias-qr-${activeQrSize}px.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        showToast("QR code downloaded");
    }, [activeQrSize]);

    const handleQrCopy = useCallback(async () => {
        const canvas = qrCanvasRef.current?.querySelector("canvas");
        if (!canvas) return;
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            showToast("QR image copied to clipboard");
        } catch {
            showToast("Copy not supported in this browser");
        }
    }, []);

    const urls = data?.data || [];

    const showToast = (message) => {
        setToast({ visible: true, message });
        setTimeout(() => setToast({ visible: false, message: "" }), 3500);
    };

    const filteredUrls = useMemo(() => {
        if (!searchQuery.trim()) return urls;
        const q = searchQuery.toLowerCase();
        return urls.filter((u) =>
            u.originalUrl.toLowerCase().includes(q) ||
            u.shortCode.toLowerCase().includes(q) ||
            (u.customAlias && u.customAlias.toLowerCase().includes(q))
        );
    }, [urls, searchQuery]);

    const stats = useMemo(() => {
        const totalClicks = urls.reduce((sum, u) => sum + (u.analytics?.totalClicks || 0), 0);
        const activeLinks = urls.filter((u) => u.status === "active" && (!u.expiresAt || new Date(u.expiresAt) >= new Date())).length;
        return { totalClicks, activeLinks, totalLinks: urls.length };
    }, [urls]);

    const applyExpiryPreset = (preset) => {
        setExpiryPreset(preset);
        if (preset === "never") { setExpiresAt(""); return; }
        const d = new Date();
        if (preset === "1d") d.setDate(d.getDate() + 1);
        else if (preset === "7d") d.setDate(d.getDate() + 7);
        else if (preset === "30d") d.setDate(d.getDate() + 30);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setExpiresAt(local);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateError("");
        setCreateSuccess("");
        const body = { originalUrl: longUrl };
        if (customAlias.trim()) body.customAlias = customAlias.trim();
        if (password.trim()) body.password = password.trim();
        if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
        if (oneTimeUse) body.oneTimeUse = true;
        try {
            const res = await createUrl(body).unwrap();
            const short = res.data?.customAlias || res.data?.shortCode;
            const fullUrl = `${BASE_URL}/${short}`;
            setCreateSuccess(fullUrl);
            showToast("Link created successfully!");
            setLongUrl("");
            setCustomAlias("");
            setPassword("");
            setExpiresAt("");
            setExpiryPreset("never");
            setOneTimeUse(false);
        } catch (err) {
            setCreateError(err?.data?.message || "Failed to create link.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteUrl(deleteTarget._id).unwrap();
            showToast("Link deleted");
        } catch { /* silently handled */ }
        setDeleteTarget(null);
    };

    const truncate = (str, max = 55) => str.length > max ? str.slice(0, max) + "…" : str;

    // Social share dropdown renderer — uses Portal to escape overflow clipping
    const renderShareMenu = (url) => {
        const alias = url.customAlias || url.shortCode;
        const fullUrl = `${BASE_URL}/${alias}`;
        const encoded = encodeURIComponent(fullUrl);
        const text = encodeURIComponent("Check out this link!");
        const channels = [
            {
                name: "WhatsApp", href: `https://wa.me/?text=${text}%20${encoded}`, color: "#25D366", icon: (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                )
            },
            {
                name: "Twitter / X", href: `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`, color: "#1DA1F2", icon: (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                )
            },
            {
                name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`, color: "#0A66C2", icon: (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                )
            },
            {
                name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`, color: "#1877F2", icon: (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                )
            },
            {
                name: "Email", href: `mailto:?subject=${text}&body=${text}%20${encoded}`, color: "#EA4335", icon: (
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                )
            },
        ];

        // Smart positioning — flip upward if not enough room below
        const MENU_HEIGHT = 250;
        const GAP = 8;
        const rect = shareBtnRef.current?.getBoundingClientRect();
        const spaceBelow = rect ? window.innerHeight - rect.bottom : Infinity;
        const openUpward = spaceBelow < MENU_HEIGHT + GAP;
        const top = rect
            ? openUpward
                ? rect.top - MENU_HEIGHT - GAP   // above the button
                : rect.bottom + GAP                // below the button
            : 0;
        const left = rect ? rect.left : 0;

        return createPortal(
            <div
                ref={shareMenuRef}
                className="w-52 rounded-xl shadow-2xl py-1.5"
                style={{
                    position: "fixed",
                    top,
                    left,
                    zIndex: 9999,
                    background: "#111827",
                    border: "1px solid #374151",
                }}
            >
                <p className="px-3.5 pt-1.5 pb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.muted, borderBottom: "1px solid #1f2937" }}>Share this link</p>
                {channels.map((ch) => (
                    <a
                        key={ch.name}
                        href={ch.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: C.text, textDecoration: "none" }}
                        onClick={() => setOpenShareId(null)}
                    >
                        <span style={{ color: ch.color }}>{ch.icon}</span>
                        {ch.name}
                    </a>
                ))}
            </div>,
            document.body
        );
    };

    const advancedVisible = isDesktop || showAdvanced;

    return (
        <div className="min-h-screen" style={{ background: C.bg }}>
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* ─── Header ─── */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold" style={{ color: C.text }}>Dashboard</h1>
                    <p className="mt-1 text-sm" style={{ color: C.muted }}>
                        {userInfo?.name ? `Welcome back, ${userInfo.name}.` : "Manage your short links and track performance."}
                    </p>
                </div>

                {/* ─── Primary Row: Create + Stats ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

                    {/* Create New Link */}
                    <div
                        className="lg:col-span-7 rounded-2xl overflow-hidden flex"
                        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.04)` }}
                    >
                        <div className="w-[3px] shrink-0 rounded-l-2xl" style={{ background: `linear-gradient(180deg, ${C.primary}, ${C.accent5})` }} />
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Zap size={18} style={{ color: C.primary }} />
                                <h2 className="text-base font-semibold" style={{ color: C.text }}>Create New Link</h2>
                            </div>

                            <form onSubmit={handleCreate}>
                                <div>
                                    <input
                                        id="url-input"
                                        type="url"
                                        required
                                        value={longUrl}
                                        onChange={(e) => setLongUrl(e.target.value)}
                                        placeholder="Paste your long URL here…"
                                        aria-label="Long URL to shorten"
                                        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2"
                                        style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
                                        onFocus={(e) => e.target.style.borderColor = C.primary}
                                        onBlur={(e) => e.target.style.borderColor = C.border}
                                    />
                                </div>

                                {/* Advanced toggle — mobile only */}
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="mt-3 text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80 sm:hidden"
                                    style={{ color: C.muted }}
                                >
                                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    Advanced ▾
                                </button>

                                {advancedVisible && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                                        {/* Custom Alias */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: C.muted }}>
                                                <Hash size={12} /> Custom Alias
                                            </label>
                                            <input
                                                type="text"
                                                value={customAlias}
                                                onChange={(e) => setCustomAlias(e.target.value)}
                                                placeholder="my-brand"
                                                aria-label="Custom alias"
                                                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all focus:ring-2"
                                                style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, ...mono }}
                                                onFocus={(e) => e.target.style.borderColor = C.primary}
                                                onBlur={(e) => e.target.style.borderColor = C.border}
                                            />
                                            <p className="text-[11px] mt-1" style={{ color: C.muted }}>Letters, numbers, and hyphens only.</p>
                                        </div>

                                        {/* Password */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: C.muted }}>
                                                <Lock size={12} /> Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="Optional"
                                                    aria-label="Password protection"
                                                    className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all focus:ring-2"
                                                    style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
                                                    onFocus={(e) => e.target.style.borderColor = C.primary}
                                                    onBlur={(e) => e.target.style.borderColor = C.border}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded transition hover:bg-white/10"
                                                    style={{ color: C.muted }}
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                            <p className="text-[11px] mt-1" style={{ color: C.muted }}>Visitors must enter this to access the link.</p>
                                        </div>

                                        {/* Expires At */}
                                        <div>
                                            <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: C.muted }}>
                                                <Clock size={12} /> Expires At
                                            </label>
                                            <div className="flex gap-1.5 mb-2 flex-wrap">
                                                {[["1d", "1 day"], ["7d", "7 days"], ["30d", "30 days"], ["never", "Never"]].map(([key, label]) => (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => applyExpiryPreset(key)}
                                                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${expiryPreset === key ? 'pill-gradient' : ''}`}
                                                        style={{
                                                            ...(expiryPreset !== key ? { background: "transparent", color: C.muted, border: `1px solid ${C.border}` } : { border: '1px solid transparent' }),
                                                        }}
                                                    >
                                                        {label}
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="datetime-local"
                                                value={expiresAt}
                                                onChange={(e) => { setExpiresAt(e.target.value); setExpiryPreset(""); }}
                                                aria-label="Expiration date"
                                                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all [color-scheme:dark] focus:ring-2"
                                                style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
                                            />
                                        </div>

                                        {/* Burn after reading */}
                                        <div className="flex items-start gap-3 pt-6">
                                            <button
                                                type="button"
                                                onClick={() => setOneTimeUse(!oneTimeUse)}
                                                role="switch"
                                                aria-checked={oneTimeUse}
                                                aria-label="Burn after reading"
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`}
                                                style={{ background: oneTimeUse ? C.warn : "#374151", focusRingColor: C.primary }}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ${oneTimeUse ? "translate-x-5" : "translate-x-0"}`} />
                                            </button>
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <Flame size={14} style={{ color: oneTimeUse ? C.warn : C.muted }} />
                                                    <span className="text-sm font-medium" style={{ color: oneTimeUse ? C.warn : C.muted }}>
                                                        Burn after reading
                                                    </span>
                                                </div>
                                                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>Link invalidates after the first click.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    onClick={() => setShowQrPreview(true)}
                                    className="w-full py-3 mt-6 bg-white text-black font-bold rounded-lg hover:bg-gray-200 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-white"
                                >
                                    {isCreating ? <Loader2 size={16} className="animate-spin" /> : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                                    )}
                                    Shorten & Get QR
                                </button>
                            </form>

                            {/* Success result + QR preview */}
                            {createSuccess && (
                                <div className="mt-5 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                                    {/* Short URL result bar */}
                                    <div className="px-4 py-3 flex items-center justify-between gap-3" style={{ background: `${C.success}10`, borderBottom: `1px solid ${C.border}` }}>
                                        <div className="flex items-center gap-2 text-sm font-medium min-w-0" style={{ color: C.success }}>
                                            <CheckCircle2 size={16} className="shrink-0" />
                                            <a href={createSuccess} target="_blank" rel="noopener noreferrer" className="truncate hover:underline" style={{ ...mono }}>
                                                {createSuccess}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <CopyBtn text={createSuccess} onToast={showToast} />
                                            <button
                                                onClick={() => { const id = urls.find(u => createSuccess.includes(u.customAlias || u.shortCode))?._id; if (id) navigate(`/stats/${id}`); }}
                                                className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition hover:bg-white/10 flex items-center gap-1"
                                                style={{ color: C.primary }}
                                            >
                                                <BarChart3 size={12} /> Analytics
                                            </button>
                                            <button
                                                onClick={() => setShowQrPreview(!showQrPreview)}
                                                className="text-xs px-2.5 py-1.5 rounded-lg font-medium transition hover:bg-white/10 flex items-center gap-1"
                                                style={{ color: C.accent }}
                                            >
                                                <QrCode size={12} /> {showQrPreview ? "Hide QR" : "Show QR"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* QR Preview + Customization */}
                                    {showQrPreview && (
                                        <div className="p-5 flex flex-col sm:flex-row gap-6" style={{ background: C.bg }}>
                                            {/* QR canvas */}
                                            <div className="flex flex-col items-center gap-3 shrink-0">
                                                <div ref={qrCanvasRef} className="rounded-xl p-3 transition-all" style={{ background: qrBg }}>
                                                    <QRCodeCanvas
                                                        value={createSuccess}
                                                        size={Math.min(activeQrSize, 300)}
                                                        bgColor={qrBg}
                                                        fgColor={qrFg}
                                                        level={qrEc}
                                                        includeMargin={qrMargin}
                                                    />
                                                </div>
                                                {scanWarning && (
                                                    <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: `${C.warn}15`, color: C.warn }}>
                                                        <AlertCircle size={12} />
                                                        {scanWarning}
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    <button onClick={handleQrDownload} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition hover:opacity-90" style={{ background: C.accent, color: C.bg }}>
                                                        <Download size={13} /> Download PNG
                                                    </button>
                                                    <button onClick={handleQrCopy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition hover:bg-white/10" style={{ border: `1px solid ${C.border}`, color: C.muted }}>
                                                        <Copy size={13} /> Copy image
                                                    </button>
                                                </div>
                                            </div>

                                            {/* QR Controls */}
                                            <div className="flex-1 space-y-4">
                                                {/* Size */}
                                                <div>
                                                    <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: C.muted }}>Size</label>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {["S", "M", "L", "XL"].map((s) => {
                                                            const active = qrSize === s && !qrCustomSize;
                                                            return (
                                                                <button key={s} onClick={() => { setQrSize(s); setQrCustomSize(""); }} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active ? 'pill-gradient' : ''}`} style={active ? { border: '1px solid transparent' } : { background: "transparent", color: C.muted, border: `1px solid ${C.border}` }}>
                                                                    {s} ({qrSizes[s]}px)
                                                                </button>
                                                            );
                                                        })}
                                                        <input
                                                            type="number"
                                                            value={qrCustomSize}
                                                            onChange={(e) => setQrCustomSize(e.target.value)}
                                                            placeholder="Custom px"
                                                            aria-label="Custom QR size in pixels"
                                                            className="w-24 px-2.5 py-1.5 rounded-md text-xs outline-none transition-all focus:ring-1"
                                                            style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, ...mono }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Colors */}
                                                <div>
                                                    <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: C.muted }}>
                                                        <Palette size={12} /> Colors
                                                    </label>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs" style={{ color: C.muted }}>FG</span>
                                                            <input type="color" value={qrFg} onChange={(e) => setQrFg(e.target.value)} aria-label="QR foreground color" className="w-8 h-8 rounded-md cursor-pointer border-0" style={{ background: "transparent" }} />
                                                            <span className="text-xs" style={{ color: C.muted, ...mono }}>{qrFg}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs" style={{ color: C.muted }}>BG</span>
                                                            <input type="color" value={qrBg} onChange={(e) => setQrBg(e.target.value)} aria-label="QR background color" className="w-8 h-8 rounded-md cursor-pointer border-0" style={{ background: "transparent" }} />
                                                            <span className="text-xs" style={{ color: C.muted, ...mono }}>{qrBg}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Error Correction */}
                                                <div>
                                                    <label className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: C.muted }}>
                                                        <Shield size={12} /> Error Correction
                                                    </label>
                                                    <div className="flex gap-1.5">
                                                        {["L", "M", "Q", "H"].map((level) => {
                                                            const active = qrEc === level;
                                                            return (
                                                                <button key={level} onClick={() => setQrEc(level)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active ? 'pill-gradient' : ''}`} style={active ? { border: '1px solid transparent' } : { background: "transparent", color: C.muted, border: `1px solid ${C.border}` }}>
                                                                    {level} {level === "L" ? "(7%)" : level === "M" ? "(15%)" : level === "Q" ? "(25%)" : "(30%)"}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    <p className="text-[11px] mt-1" style={{ color: C.muted }}>Higher = more damage resistance, larger QR.</p>
                                                </div>

                                                {/* Margin */}
                                                <div className="flex items-center gap-3">
                                                    <button type="button" onClick={() => setQrMargin(!qrMargin)} role="switch" aria-checked={qrMargin} aria-label="Include margin" className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200" style={{ background: qrMargin ? C.primary : "#374151" }}>
                                                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition duration-200 ${qrMargin ? "translate-x-4" : "translate-x-0"}`} />
                                                    </button>
                                                    <span className="text-xs font-medium" style={{ color: C.muted }}>Include quiet zone margin</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {createError && (
                                <div className="mt-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ background: "#f8717115", border: "1px solid #f8717130", color: "#f87171" }}>
                                    <AlertCircle size={16} className="shrink-0" />
                                    {createError}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div
                        className="lg:col-span-5 rounded-2xl overflow-hidden"
                        style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.04)` }}
                    >
                        <div className="h-[2px]" style={{ background: C.gradient }} />
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <BarChart3 size={18} style={{ color: C.accent }} />
                                <h2 className="text-base font-semibold" style={{ color: C.text }}>Quick Stats</h2>
                            </div>
                            <div className="space-y-6">
                                <StatTile icon={MousePointerClick} label="Total Clicks" value={stats.totalClicks} color={C.accent1} />
                                <StatTile icon={Zap} label="Active Links" value={stats.activeLinks} color={C.accent3} />
                                <StatTile icon={Globe} label="Total Links" value={stats.totalLinks} color={C.accent4} />
                                <StatTile icon={QrCode} label="QR Codes" value={stats.totalLinks} color={C.accent5} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Your Links ─── */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.04)` }}
                >
                    <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                        <h2 className="text-base font-semibold" style={{ color: C.text }}>Your Links</h2>
                        <div className="flex items-center gap-3">
                            {/* View toggle */}
                            <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: C.bg }}>
                                <button
                                    onClick={() => setViewMode("list")}
                                    aria-label="List view"
                                    className="p-1.5 rounded-md transition"
                                    style={{ color: viewMode === "list" ? C.primary : C.muted, background: viewMode === "list" ? `${C.primary}15` : "transparent" }}
                                >
                                    <List size={14} />
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    aria-label="Grid view"
                                    className="p-1.5 rounded-md transition"
                                    style={{ color: viewMode === "grid" ? C.primary : C.muted, background: viewMode === "grid" ? `${C.primary}15` : "transparent" }}
                                >
                                    <LayoutGrid size={14} />
                                </button>
                            </div>
                            {/* Search */}
                            <div className="relative w-full sm:w-56">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search links…"
                                    aria-label="Search links"
                                    className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2"
                                    style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}
                                    onFocus={(e) => e.target.style.borderColor = C.primary}
                                    onBlur={(e) => e.target.style.borderColor = C.border}
                                />
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={28} className="animate-spin" style={{ color: C.primary }} />
                        </div>
                    ) : isError ? (
                        <div className="text-center py-20 text-sm" style={{ color: "#f87171" }}>
                            Failed to load your links. Please try again.
                        </div>
                    ) : filteredUrls.length === 0 ? (
                        <div className="text-center py-20">
                            <Link2 size={40} className="mx-auto mb-3" style={{ color: C.border }} />
                            <p className="text-sm mb-4" style={{ color: C.muted }}>
                                {urls.length === 0 ? "No links yet. Create your first short link!" : "No links match your search."}
                            </p>
                            {urls.length === 0 && (
                                <button
                                    onClick={() => document.getElementById("url-input")?.focus()}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
                                    style={{ background: C.primary, color: C.bg }}
                                >
                                    <Plus size={16} /> Create your first link
                                </button>
                            )}
                        </div>
                    ) : viewMode === "list" ? (
                        /* ── List View ── */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-xs uppercase tracking-wider font-medium" style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                                        <th className="px-6 py-3">Short URL</th>
                                        <th className="px-6 py-3">Original URL</th>
                                        <th className="px-6 py-3 text-center">Clicks</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUrls.map((url) => {
                                        const shortUrl = `${BASE_URL}/${url.customAlias || url.shortCode}`;
                                        return (
                                            <tr key={url._id} className="group transition-colors" style={{ borderBottom: `1px solid ${C.border}40` }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = `${C.primary}05`}
                                                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="chip-short-url truncate max-w-[180px] no-underline" style={{ textDecoration: 'none' }}>
                                                            /{url.customAlias || url.shortCode}
                                                        </a>
                                                        <CopyBtn text={shortUrl} onToast={showToast} />
                                                        <button
                                                            onClick={(e) => toggleShare(url._id, e.currentTarget)}
                                                            aria-label="Share link"
                                                            className="p-1.5 rounded-md transition hover:bg-white/10"
                                                            style={{ color: openShareId === url._id ? C.primary : C.muted }}
                                                        >
                                                            <Share2 size={14} />
                                                        </button>
                                                        {openShareId === url._id && renderShareMenu(url)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a href={url.originalUrl} target="_blank" rel="noopener noreferrer" title={url.originalUrl} className="text-sm transition flex items-center gap-1.5 max-w-xs group/link" style={{ color: C.muted }}>
                                                        <span className="truncate">{truncate(url.originalUrl)}</span>
                                                        <ExternalLink size={12} className="shrink-0 opacity-0 group-hover/link:opacity-100 transition" />
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full" style={{ color: C.text, background: `${C.primary}10`, ...mono }}>
                                                        {(url.analytics?.totalClicks || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <StatusBadge status={url.status} expiresAt={url.expiresAt} oneTimeUse={url.oneTimeUse} />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => setQrUrl(shortUrl)} aria-label="QR Code" className="p-2 rounded-lg transition hover:bg-white/10" style={{ color: C.muted }} title="QR Code">
                                                            <QrCode size={15} />
                                                        </button>
                                                        <button onClick={() => navigate(`/stats/${url._id}`)} aria-label="Analytics" className="p-2 rounded-lg transition hover:bg-white/10" style={{ color: C.muted }} title="Analytics">
                                                            <BarChart3 size={15} />
                                                        </button>
                                                        <button onClick={() => setDeleteTarget(url)} aria-label="Delete" className="p-2 rounded-lg transition hover:bg-red-500/10" style={{ color: C.muted }} title="Delete">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        /* ── Grid View ── */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                            {filteredUrls.map((url) => {
                                const shortUrl = `${BASE_URL}/${url.customAlias || url.shortCode}`;
                                return (
                                    <div
                                        key={url._id}
                                        className="card-hover rounded-xl p-4 motion-reduce:hover:translate-y-0"
                                        style={{ background: C.bg, border: `1px solid ${C.border}` }}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="chip-short-url truncate" style={{ textDecoration: 'none' }}>
                                                /{url.customAlias || url.shortCode}
                                            </a>
                                            <StatusBadge status={url.status} expiresAt={url.expiresAt} oneTimeUse={url.oneTimeUse} />
                                        </div>
                                        <p className="text-xs truncate mb-3" title={url.originalUrl} style={{ color: C.muted }}>
                                            {url.originalUrl}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${C.primary}10`, color: C.primary, ...mono }}>
                                                {(url.analytics?.totalClicks || 0).toLocaleString()} clicks
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <CopyBtn text={shortUrl} onToast={showToast} />
                                                <button
                                                    onClick={(e) => toggleShare(url._id, e.currentTarget)}
                                                    aria-label="Share link"
                                                    className="p-1.5 rounded-md transition hover:bg-white/10"
                                                    style={{ color: openShareId === url._id ? C.primary : C.muted }}
                                                >
                                                    <Share2 size={13} />
                                                </button>
                                                {openShareId === url._id && renderShareMenu(url)}
                                                <button onClick={() => setQrUrl(shortUrl)} aria-label="QR Code" className="p-1.5 rounded-md transition hover:bg-white/10" style={{ color: C.muted }}>
                                                    <QrCode size={13} />
                                                </button>
                                                <button onClick={() => navigate(`/stats/${url._id}`)} aria-label="Analytics" className="p-1.5 rounded-md transition hover:bg-white/10" style={{ color: C.muted }}>
                                                    <BarChart3 size={13} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(url)} aria-label="Delete" className="p-1.5 rounded-md transition hover:bg-red-500/10" style={{ color: C.muted }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {qrUrl && <QrModal url={qrUrl} onClose={() => setQrUrl(null)} />}
            {deleteTarget && <DeleteModal url={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}
            <Toast message={toast.message} visible={toast.visible} />
        </div>
    );
}
