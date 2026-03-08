import { useMemo, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import {
    ArrowLeft,
    MousePointerClick,
    Globe,
    Monitor,
    Loader2,
    AlertCircle,
    Copy,
    Download,
    Pencil,
    Check,
} from "lucide-react";
import { useGetAnalyticsQuery } from "../store/analyticsSlice";

const BASE_URL = "https://nanoalias.com";

/* ─── Country code → Emoji Flag + Name ─── */
const COUNTRY_NAMES = {
    US: "United States", GB: "United Kingdom", IN: "India", DE: "Germany",
    FR: "France", CA: "Canada", AU: "Australia", BR: "Brazil", JP: "Japan",
    CN: "China", KR: "South Korea", RU: "Russia", IT: "Italy", ES: "Spain",
    MX: "Mexico", NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark",
    FI: "Finland", PL: "Poland", TR: "Turkey", SA: "Saudi Arabia", AE: "UAE",
    SG: "Singapore", ID: "Indonesia", TH: "Thailand", PH: "Philippines",
    MY: "Malaysia", VN: "Vietnam", ZA: "South Africa", NG: "Nigeria",
    EG: "Egypt", KE: "Kenya", AR: "Argentina", CL: "Chile", CO: "Colombia",
    PE: "Peru", PK: "Pakistan", BD: "Bangladesh", LK: "Sri Lanka",
    NZ: "New Zealand", IE: "Ireland", PT: "Portugal", CH: "Switzerland",
    AT: "Austria", BE: "Belgium", CZ: "Czech Republic", RO: "Romania",
    HU: "Hungary", GR: "Greece", IL: "Israel", UA: "Ukraine",
};

function countryFlag(code) {
    if (!code || code === "unknown") return "🌍";
    const upper = code.toUpperCase();
    return String.fromCodePoint(...[...upper].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

function countryLabel(code) {
    if (!code || code === "unknown") return "Unknown";
    const upper = code.toUpperCase();
    return `${countryFlag(upper)} ${COUNTRY_NAMES[upper] || upper}`;
}

/* ─── Referrer Display ─── */
function formatReferrer(ref) {
    if (!ref || ref === "direct") return "Direct";
    try {
        const host = new URL(ref).hostname.replace("www.", "");
        const names = {
            "linkedin.com": "LinkedIn", "github.com": "GitHub",
            "twitter.com": "Twitter / X", "x.com": "Twitter / X",
            "facebook.com": "Facebook", "t.co": "Twitter / X",
            "reddit.com": "Reddit", "youtube.com": "YouTube",
            "google.com": "Google", "bing.com": "Bing",
        };
        return names[host] || host;
    } catch { return ref; }
}

/* ─── Bar colors per section ─── */
const ACCENT = {
    location: "#7dd3fc",
    device: "#9b7bff",
    referrer: "#ff6fb5",
};

/* ─── Sub-components ─── */
function SummaryCard({ icon: Icon, label, value, accent }) {
    return (
        <div className="border rounded-xl p-6 flex items-center gap-4 backdrop-blur-sm" style={{ background: '#0b0b0b', borderColor: 'rgba(26,26,26,0.6)' }}>
            <div
                className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${accent}18` }}
            >
                <Icon size={22} style={{ color: accent }} />
            </div>
            <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                    {label}
                </p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: '#e6eef8' }}>{value}</p>
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-lg px-3 py-2 shadow-lg text-sm" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
            <p className="text-slate-400 mb-0.5">{label}</p>
            <p className="text-white font-semibold">{payload[0].value} clicks</p>
        </div>
    );
}

function ProgressList({ title, items, accent, maxValue }) {
    return (
        <div className="rounded-2xl p-5 shadow-xl" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">{title}</h3>
            {items.length === 0 ? (
                <p className="text-slate-500 text-sm py-6 text-center">No data yet.</p>
            ) : (
                <div className="space-y-3">
                    {items.map((item, i) => {
                        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                        return (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-slate-300 truncate max-w-[70%]">{item.label}</span>
                                    <span className="text-xs font-semibold tabular-nums" style={{ color: accent }}>{item.value.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                    <div
                                        className="h-full rounded-full transition-all duration-700 ease-out"
                                        style={{ width: `${Math.max(pct, 2)}%`, background: accent, opacity: 0.85 }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ─── Quick Action Button ─── */
function ActionBtn({ icon: Icon, label, onClick, accent = "#9aa7b8" }) {
    return (
        <button
            onClick={onClick}
            title={label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/10"
            style={{ color: accent, border: '1px solid rgba(26,26,26,0.6)' }}
        >
            <Icon size={14} />{label}
        </button>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Main Analytics Page
   ═══════════════════════════════════════════════════════════════ */
export default function Analytics() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useGetAnalyticsQuery(id);

    const [copied, setCopied] = useState(false);
    const qrRef = useRef(null);

    const url = data?.data?.url;
    const stats = data?.data?.stats;

    /* ─── Chart Data ─── */
    const chartData = useMemo(() => {
        if (!stats?.clicksOverTime) return [];
        return stats.clicksOverTime.map((d) => ({
            date: d._id,
            clicks: d.count,
        }));
    }, [stats]);

    /* ─── Summary Metrics ─── */
    const totalClicks = useMemo(() => {
        if (url?.analytics?.totalClicks != null) return url.analytics.totalClicks;
        if (!stats?.clicksOverTime) return 0;
        return stats.clicksOverTime.reduce((sum, d) => sum + d.count, 0);
    }, [stats, url]);

    const topLocation = useMemo(() => {
        if (!stats?.byCountry?.length) return "—";
        return stats.byCountry[0]._id || "Unknown";
    }, [stats]);

    const topDevice = useMemo(() => {
        if (!stats?.byDevice?.length) return "—";
        return stats.byDevice.reduce((a, b) => (a.count >= b.count ? a : b))._id || "Unknown";
    }, [stats]);

    /* ─── Progress Bar Data ─── */
    const locationItems = useMemo(() => {
        if (!stats?.byCountry) return [];
        return stats.byCountry.slice(0, 8).map((d) => ({
            label: countryLabel(d._id),
            value: d.count,
        }));
    }, [stats]);

    const deviceOsItems = useMemo(() => {
        const map = {};
        if (stats?.byDevice) {
            stats.byDevice.forEach((d) => {
                const k = (d._id || "unknown").charAt(0).toUpperCase() + (d._id || "unknown").slice(1);
                map[k] = (map[k] || 0) + d.count;
            });
        }
        if (stats?.byOS) {
            stats.byOS.forEach((d) => {
                const k = d._id || "Unknown";
                map[k] = (map[k] || 0) + d.count;
            });
        }
        if (stats?.byBrowser) {
            stats.byBrowser.forEach((d) => {
                const k = d._id || "Unknown";
                map[k] = (map[k] || 0) + d.count;
            });
        }
        return Object.entries(map)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [stats]);

    const referrerItems = useMemo(() => {
        // Pull from analytics.clicks embedded array if available
        const refMap = {};
        if (url?.analytics?.clicks?.length) {
            url.analytics.clicks.forEach((c) => {
                const key = formatReferrer(c.referrer);
                refMap[key] = (refMap[key] || 0) + 1;
            });
        }
        // Also pull from aggregated referrer stats if API provides them
        // (future-proof)
        return Object.entries(refMap)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }, [url]);

    /* ─── Quick Actions ─── */
    const shortUrl = url ? `${BASE_URL}/${url.customAlias || url.shortCode}` : "";

    const handleCopy = useCallback(async () => {
        try { await navigator.clipboard.writeText(shortUrl); } catch { /* */ }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [shortUrl]);

    const handleDownloadQr = useCallback(() => {
        const canvas = qrRef.current?.querySelector("canvas");
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = `nanoalias-qr-${url?.customAlias || url?.shortCode}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    }, [url]);

    /* ─── Loading / Error States ─── */
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: '#000000' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: '#7dd3fc' }} />
            </div>
        );
    }

    if (isError || !data?.success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#000000' }}>
                <AlertCircle size={36} className="text-red-400" />
                <p className="text-slate-400">Failed to load analytics data.</p>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="text-primary-light hover:text-primary transition text-sm"
                >
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    const maxLoc = locationItems[0]?.value || 1;
    const maxDev = deviceOsItems[0]?.value || 1;
    const maxRef = referrerItems[0]?.value || 1;

    return (
        <div className="min-h-screen" style={{ background: '#000000' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header + Quick Actions */}
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-8">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="p-2 rounded-lg bg-surface-light border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition shrink-0"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold text-white">Link Analytics</h1>
                            {url && (
                                <p className="text-sm text-slate-400 mt-0.5 truncate max-w-lg">
                                    /{url.customAlias || url.shortCode}
                                    <span className="mx-2 text-slate-600">→</span>
                                    {url.originalUrl}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <ActionBtn
                            icon={copied ? Check : Copy}
                            label="Copy Link"
                            onClick={handleCopy}
                            accent={copied ? "#34d399" : "#9aa7b8"}
                        />
                        <ActionBtn icon={Download} label="Download QR" onClick={handleDownloadQr} />
                        <ActionBtn
                            icon={Pencil}
                            label="Edit"
                            onClick={() => navigate("/dashboard")}
                        />
                    </div>
                </div>

                {/* Hidden QR for download */}
                <div ref={qrRef} className="absolute -left-[9999px]" aria-hidden="true">
                    <QRCodeCanvas value={shortUrl} size={400} bgColor="#ffffff" fgColor="#0f172a" level="H" includeMargin />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <SummaryCard
                        icon={MousePointerClick}
                        label="Total Clicks"
                        value={totalClicks.toLocaleString()}
                        accent="#7dd3fc"
                    />
                    <SummaryCard
                        icon={Globe}
                        label="Top Location"
                        value={topLocation === "—" ? "—" : countryLabel(topLocation)}
                        accent="#ff6fb5"
                    />
                    <SummaryCard
                        icon={Monitor}
                        label="Top Device"
                        value={topDevice.charAt(0).toUpperCase() + topDevice.slice(1)}
                        accent="#9b7bff"
                    />
                </div>

                {/* Clicks Over Time — Area Chart */}
                <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm mb-8" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
                    <h2 className="text-lg font-semibold text-white mb-4">
                        Clicks Over Time
                    </h2>
                    {chartData.length === 0 ? (
                        <p className="text-center text-slate-500 py-16 text-sm">
                            No click data yet.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#7dd3fc" stopOpacity={0.02} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#64748b"
                                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                                    tickLine={false}
                                    allowDecimals={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="clicks"
                                    stroke="#7dd3fc"
                                    strokeWidth={2.5}
                                    fill="url(#clicksGradient)"
                                    dot={{ r: 4, fill: "#7dd3fc", strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: "#9b7bff", strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Progress Bar Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ProgressList
                        title="Top Locations"
                        items={locationItems}
                        accent={ACCENT.location}
                        maxValue={maxLoc}
                    />
                    <ProgressList
                        title="Device & OS Breakdown"
                        items={deviceOsItems}
                        accent={ACCENT.device}
                        maxValue={maxDev}
                    />
                    <ProgressList
                        title="Traffic Sources"
                        items={referrerItems}
                        accent={ACCENT.referrer}
                        maxValue={maxRef}
                    />
                </div>
            </div>
        </div>
    );
}
