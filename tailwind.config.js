/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#020617",
                surface: "#0f172a",
                border: "#1e293b",
                primary: "#f97316", // Vibrant Orange
                success: "#10b981", // Emerald
                danger: "#ef4444",  // Red
                textPrimary: "#e2e8f0",
                textSecondary: "#94a3b8",
                textMuted: "#64748b"
            },
            fontFamily: {
                sans: ["'DM Sans'", "sans-serif"],
                mono: ["'DM Mono'", "monospace"],
            },
        },
    },
    plugins: [],
}
