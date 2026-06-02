import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        border:     "#e8e0d8",
        background: "#ffffff",
        foreground: "#1c1410",
        primary: {
          DEFAULT: "#ea580c",   /* orange-600 */
          light:   "#fb923c",   /* orange-400 */
          dark:    "#c2410c",   /* orange-700 */
        },
        muted: {
          DEFAULT: "#f5ede6",
          fg:      "#78716c",   /* stone-500 */
        },
        accent:  "#ea580c",
        warning: "#d97706",
        danger:  "#dc2626",
        success: "#16a34a",
        info:    "#0891b2",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
        card: "0 2px 8px rgba(234,88,12,.06), 0 1px 3px rgba(0,0,0,.06)",
        glow: "0 0 0 3px rgba(234,88,12,.18)",
      },
      borderRadius: {
        xl:  "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
