import { useState } from "react";
import {
    Shield,
    Users,
    Link2,
    ToggleLeft,
    ToggleRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Search,
} from "lucide-react";
import {
    useGetSystemUsersQuery,
    useGetSystemUrlsQuery,
    useToggleSystemUrlStatusMutation,
} from "../store/adminApiSlice";

const tabs = [
    { id: "users", label: "User Management", icon: Users },
    { id: "links", label: "Global Links", icon: Link2 },
];

function RoleBadge({ role }) {
    const isAdmin = role === "admin";
    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${isAdmin
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                : "bg-slate-500/10 text-slate-400 border-slate-500/30"
                }`}
        >
            {isAdmin && <Shield size={11} />}
            {isAdmin ? "Admin" : "User"}
        </span>
    );
}

function VerifiedBadge({ verified }) {
    return verified ? (
        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <CheckCircle2 size={13} />
            Verified
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-medium">
            <XCircle size={13} />
            Pending
        </span>
    );
}

function StatusToggleButton({ urlId, currentStatus, onToggle, isToggling }) {
    const isActive = currentStatus === "active";
    return (
        <button
            onClick={() => onToggle(urlId)}
            disabled={isToggling}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${isActive
                ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isActive ? "Disable this link" : "Enable this link"}
        >
            {isToggling ? (
                <Loader2 size={13} className="animate-spin" />
            ) : isActive ? (
                <ToggleRight size={14} />
            ) : (
                <ToggleLeft size={14} />
            )}
            {isActive ? "Disable" : "Enable"}
        </button>
    );
}

function UsersTable({ users, searchQuery }) {
    const filtered = searchQuery.trim()
        ? users.filter(
            (u) =>
                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : users;

    if (filtered.length === 0) {
        return (
            <div className="text-center py-16">
                <Users size={36} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">
                    {users.length === 0 ? "No users found." : "No users match your search."}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                        <th className="px-6 py-3 font-medium">Name</th>
                        <th className="px-6 py-3 font-medium">Email</th>
                        <th className="px-6 py-3 font-medium text-center">Role</th>
                        <th className="px-6 py-3 font-medium text-center">Verified</th>
                        <th className="px-6 py-3 font-medium text-center">Links</th>
                        <th className="px-6 py-3 font-medium text-right">Joined</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                    {filtered.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4 text-sm text-white font-medium">
                                {user.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                            <td className="px-6 py-4 text-center">
                                <RoleBadge role={user.role} />
                            </td>
                            <td className="px-6 py-4 text-center">
                                <VerifiedBadge verified={user.isVerified} />
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-white font-semibold">
                                {user.linkCount ?? 0}
                            </td>
                            <td className="px-6 py-4 text-right text-sm text-slate-400">
                                {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function LinksTable({ urls, searchQuery, onToggle, togglingId }) {
    const filtered = searchQuery.trim()
        ? urls.filter(
            (u) =>
                u.shortCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.originalUrl?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : urls;

    const truncate = (str, max = 45) =>
        str && str.length > max ? str.slice(0, max) + "…" : str || "—";

    if (filtered.length === 0) {
        return (
            <div className="text-center py-16">
                <Link2 size={36} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400 text-sm">
                    {urls.length === 0 ? "No links found." : "No links match your search."}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700/60">
                        <th className="px-6 py-3 font-medium">Short Code</th>
                        <th className="px-6 py-3 font-medium">Original URL</th>
                        <th className="px-6 py-3 font-medium">Owner</th>
                        <th className="px-6 py-3 font-medium text-center">Clicks</th>
                        <th className="px-6 py-3 font-medium text-center">Status</th>
                        <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                    {filtered.map((url) => (
                        <tr key={url._id} className="hover:bg-slate-800/40 transition">
                            <td className="px-6 py-4">
                                <span className="text-primary-light text-sm font-medium">
                                    /{url.customAlias || url.shortCode}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <a
                                    href={url.originalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-slate-300 hover:text-white text-sm transition flex items-center gap-1 group max-w-xs"
                                >
                                    <span className="truncate">
                                        {truncate(url.originalUrl)}
                                    </span>
                                    <ExternalLink
                                        size={12}
                                        className="shrink-0 opacity-0 group-hover:opacity-100 transition"
                                    />
                                </a>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                                {url.user?.email || "—"}
                            </td>
                            <td className="px-6 py-4 text-center text-sm text-white font-semibold">
                                {(url.clicks || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${url.status === "active"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                        }`}
                                >
                                    {url.status === "active" ? "Active" : "Disabled"}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <StatusToggleButton
                                    urlId={url._id}
                                    currentStatus={url.status}
                                    onToggle={onToggle}
                                    isToggling={togglingId === url._id}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function AdminPanel() {
    const [activeTab, setActiveTab] = useState("users");
    const [searchQuery, setSearchQuery] = useState("");
    const [togglingId, setTogglingId] = useState(null);

    const {
        data: usersData,
        isLoading: usersLoading,
        isError: usersError,
    } = useGetSystemUsersQuery();

    const {
        data: urlsData,
        isLoading: urlsLoading,
        isError: urlsError,
    } = useGetSystemUrlsQuery();

    const [toggleStatus] = useToggleSystemUrlStatusMutation();

    const handleToggle = async (id) => {
        setTogglingId(id);
        try {
            await toggleStatus(id).unwrap();
        } catch {
            /* handled by RTK */
        } finally {
            setTogglingId(null);
        }
    };

    const users = usersData?.data || [];
    const urls = urlsData?.data || [];
    const isLoading = activeTab === "users" ? usersLoading : urlsLoading;
    const isError = activeTab === "users" ? usersError : urlsError;

    return (
        <div className="min-h-screen" style={{ background: '#000000' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-8 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Shield size={22} className="text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                        <p className="text-slate-400 text-sm">
                            System-wide management console
                        </p>
                    </div>
                </div>

                {/* Tabs + Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex gap-1 rounded-xl p-1" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setSearchQuery("");
                                    }}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${isActive
                                        ? "bg-primary/20 text-primary-light"
                                        : "text-slate-400 hover:text-white hover:bg-slate-700/40"
                                        }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={
                                activeTab === "users"
                                    ? "Search users…"
                                    : "Search links or owners…"
                            }
                            className="w-full pl-9 pr-3 py-2.5 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition"
                            style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}
                        />
                    </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="rounded-xl px-4 py-3 text-center" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
                        <p className="text-2xl font-bold text-white">{users.length}</p>
                        <p className="text-xs text-slate-400">Total Users</p>
                    </div>
                    <div className="rounded-xl px-4 py-3 text-center" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
                        <p className="text-2xl font-bold text-white">
                            {users.filter((u) => u.role === "admin").length}
                        </p>
                        <p className="text-xs text-slate-400">Admins</p>
                    </div>
                    <div className="rounded-xl px-4 py-3 text-center" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
                        <p className="text-2xl font-bold text-white">{urls.length}</p>
                        <p className="text-xs text-slate-400">Total Links</p>
                    </div>
                    <div className="rounded-xl px-4 py-3 text-center" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
                        <p className="text-2xl font-bold text-white">
                            {urls.filter((u) => u.status === "active").length}
                        </p>
                        <p className="text-xs text-slate-400">Active Links</p>
                    </div>
                </div>

                {/* Content */}
                <div className="rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden" style={{ background: '#0b0b0b', border: '1px solid rgba(26,26,26,0.6)' }}>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={28} className="animate-spin text-primary-light" />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-2">
                            <AlertCircle size={28} className="text-red-400" />
                            <p className="text-slate-400 text-sm">
                                Failed to load data. Please try again.
                            </p>
                        </div>
                    ) : activeTab === "users" ? (
                        <UsersTable users={users} searchQuery={searchQuery} />
                    ) : (
                        <LinksTable
                            urls={urls}
                            searchQuery={searchQuery}
                            onToggle={handleToggle}
                            togglingId={togglingId}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
