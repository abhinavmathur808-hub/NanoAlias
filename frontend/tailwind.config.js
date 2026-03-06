/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "var(--accent-1)",
                    light: "var(--accent-1)",
                    dark: "var(--accent-5)",
                },
                surface: {
                    DEFAULT: "var(--bg)",
                    light: "var(--card)",
                    lighter: "var(--border)",
                },
                accent: "var(--accent-2)",
                "accent-1": "var(--accent-1)",
                "accent-2": "var(--accent-2)",
                "accent-3": "var(--accent-3)",
                "accent-4": "var(--accent-4)",
                "accent-5": "var(--accent-5)",
            },
            fontFamily: {
                sans: ["DM Sans", "Inter", "system-ui", "sans-serif"],
                title: ["Poppins", "sans-serif"],
                mono: ["JetBrains Mono", "monospace"],
            },
            boxShadow: {
                glow: "0 0 24px var(--glow-primary)",
                "glow-sm": "0 0 12px var(--glow-primary)",
                "glow-secondary": "0 0 20px var(--glow-secondary)",
            },
        },
    },
    plugins: [],
};
