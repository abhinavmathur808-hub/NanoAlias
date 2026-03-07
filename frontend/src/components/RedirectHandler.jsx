import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function RedirectHandler() {
    const { alias } = useParams();
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!alias) return;

        // The backend /:alias route handles the actual 302 redirect,
        // password gates, expiry checks, and analytics tracking.
        // We simply point the browser at it.
        const backendRedirectUrl = `${API_URL.replace("/api", "")}/${alias}`;
        window.location.replace(backendRedirectUrl);

        // Fallback: if we're still here after 8 seconds, show an error
        const timeout = setTimeout(() => setError(true), 8000);
        return () => clearTimeout(timeout);
    }, [alias]);

    if (error) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#000",
                color: "#e6eef8",
                fontFamily: "'Inter', sans-serif",
            }}>
                <p style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                    Something went wrong
                </p>
                <p style={{ color: "#9aa7b8", marginTop: "0.5rem", fontSize: "0.875rem" }}>
                    The link could not be resolved. It may be invalid or expired.
                </p>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000",
            color: "#e6eef8",
            fontFamily: "'Inter', sans-serif",
            gap: "1rem",
        }}>
            <div style={{
                width: 40,
                height: 40,
                border: "3px solid #1a1a1a",
                borderTopColor: "#7dd3fc",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ fontSize: "0.875rem", color: "#9aa7b8" }}>
                Redirecting…
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
