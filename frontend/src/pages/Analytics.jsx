import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import {
    ArrowLeft,
    MousePointerClick,
    Globe,
    Monitor,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useGetAnalyticsQuery } from "../store/analyticsSlice";

const PIE_COLORS = ["#7dd3fc", "#ff6fb5", "#7efc6a", "#ffb86b", "#9b7bff", "#34d399", "#fb923c", "#94a3b8"];

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

function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text
            x={x}
            y={y}
            fill="#fff"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fontWeight={600}
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
}

export default function Analytics() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data, isLoading, isError } = useGetAnalyticsQuery(id);

    const url = data?.data?.url;
    const stats = data?.data?.stats;

    const chartData = useMemo(() => {
        if (!stats?.clicksOverTime) return [];
        return stats.clicksOverTime.map((d) => ({
            date: d._id,
            clicks: d.count,
        }));
    }, [stats]);

    const deviceData = useMemo(() => {
        if (!stats?.byDevice) return [];
        return stats.byDevice.map((d) => ({ name: d._id || "Unknown", value: d.count }));
    }, [stats]);

    const locationData = useMemo(() => {
        if (!stats?.byCountry) return [];
        return stats.byCountry.slice(0, 8).map((d) => ({ name: d._id || "Unknown", value: d.count }));
    }, [stats]);

    const totalClicks = useMemo(() => {
        if (!stats?.clicksOverTime) return url?.clicks || 0;
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

    return (
        <div className="min-h-screen" style={{ background: '#000000' }}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="p-2 rounded-lg bg-surface-light border border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600 transition"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
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
                        value={topLocation}
                        accent="#ff6fb5"
                    />
                    <SummaryCard
                        icon={Monitor}
                        label="Top Device"
                        value={topDevice.charAt(0).toUpperCase() + topDevice.slice(1)}
                        accent="#9b7bff"
                    />
                </div>

                {/* Clicks Over Time */}
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
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
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
                                <Line
                                    type="monotone"
                                    dataKey="clicks"
                                    stroke="#7dd3fc"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: "#7dd3fc", strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: "#9b7bff", strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pie Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Device Stats */}
                    <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
                        <h2 className="text-lg font-semibold text-white mb-4">
                            Device Breakdown
                        </h2>
                        {deviceData.length === 0 ? (
                            <p className="text-center text-slate-500 py-16 text-sm">
                                No data yet.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={deviceData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        innerRadius={50}
                                        labelLine={false}
                                        label={PieLabel}
                                    >
                                        {deviceData.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#0b0b0b",
                                            border: "1px solid rgba(26,26,26,0.6)",
                                            borderRadius: "8px",
                                            color: "#e6eef8",
                                            fontSize: "13px",
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                                        formatter={(val) => (
                                            <span className="text-slate-300 capitalize">{val}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Location Stats */}
                    <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
                        <h2 className="text-lg font-semibold text-white mb-4">
                            Top Locations
                        </h2>
                        {locationData.length === 0 ? (
                            <p className="text-center text-slate-500 py-16 text-sm">
                                No data yet.
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={locationData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        innerRadius={50}
                                        labelLine={false}
                                        label={PieLabel}
                                    >
                                        {locationData.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={PIE_COLORS[i % PIE_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#0b0b0b",
                                            border: "1px solid rgba(26,26,26,0.6)",
                                            borderRadius: "8px",
                                            color: "#e6eef8",
                                            fontSize: "13px",
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
                                        formatter={(val) => (
                                            <span className="text-slate-300">{val}</span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
