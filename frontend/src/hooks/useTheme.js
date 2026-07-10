import { useEffect, useState } from "react";

const STORAGE_KEY = "na-theme";

function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return "dark"; // NanoAlias is dark-branded by default
}

// Apply immediately at module load so there's no flash of the wrong
// theme before React mounts.
document.documentElement.dataset.theme = getInitialTheme();

export default function useTheme() {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        // Briefly enable global color transitions so the switch cross-fades
        // instead of snapping (class is defined in index.css).
        const root = document.documentElement;
        root.classList.add("theme-switching");
        setTheme((t) => (t === "dark" ? "light" : "dark"));
        setTimeout(() => root.classList.remove("theme-switching"), 350);
    };

    return { theme, toggleTheme, isDark: theme === "dark" };
}
