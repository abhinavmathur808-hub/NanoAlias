export default function StatsCard({ title, value }) {
    return (
        <div id="stats-card" className="p-6 rounded-xl bg-surface-light border border-slate-700">
            <p className="text-sm text-slate-400">{title}</p>
            <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
    );
}
