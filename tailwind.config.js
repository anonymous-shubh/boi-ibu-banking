/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // BOI primary navy (Arttha-inspired)
        primary: {
          900: "#0A1F44",
          800: "#102B5C",
          700: "#1A3A6B",
          600: "#1E4D8C",
          500: "#2463AE",
          400: "#3B7BC8",
          300: "#6099D9",
          200: "#9ABDE8",
          100: "#D4E4F7",
          50:  "#EBF3FC",
          DEFAULT: "#0A1F44",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#C9A84C",
          gold:    "#C9A84C",
          light:   "#F0E6C8",
          dark:    "#A8873A",
          foreground: "#0A1F44",
        },
        surface: {
          0:   "#FFFFFF",
          50:  "#F8F9FC",
          100: "#F0F2F7",
          200: "#E4E7EF",
          300: "#CBD1DF",
        },
        success: {
          DEFAULT: "#16A34A",
          50:  "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          500: "#16A34A",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
        },
        warning: {
          DEFAULT: "#D97706",
          50:  "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#D97706",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
        },
        error: {
          DEFAULT: "#DC2626",
          50:  "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#DC2626",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
        },
        info: {
          DEFAULT: "#0284C7",
          50:  "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          500: "#0284C7",
          600: "#0284C7",
          700: "#0369A1",
        },
        // shadcn/ui compatibility aliases
        background: "#F8F9FC",
        foreground: "#0F172A",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        secondary: {
          DEFAULT: "#F0F2F7",
          foreground: "#0F172A",
        },
        muted: {
          DEFAULT: "#F0F2F7",
          foreground: "#64748B",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
        border: "#E4E7EF",
        input:  "#E4E7EF",
        ring:   "#2463AE",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        lg: "0.625rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      boxShadow: {
        card:    "0 1px 3px 0 rgba(10,31,68,0.08), 0 1px 2px -1px rgba(10,31,68,0.06)",
        panel:   "0 4px 6px -1px rgba(10,31,68,0.08), 0 2px 4px -2px rgba(10,31,68,0.06)",
        modal:   "0 20px 25px -5px rgba(10,31,68,0.12), 0 8px 10px -6px rgba(10,31,68,0.08)",
        sidebar: "2px 0 8px 0 rgba(10,31,68,0.12)",
      },
      animation: {
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "fade-in":    "fade-in 0.2s ease-out",
        "slide-up":   "slide-up 0.25s ease-out",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.6" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
