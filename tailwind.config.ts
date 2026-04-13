import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "#F8FAFC",
          card: "#FFFFFF",
          sidebar: "#0F172A",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
          sidebar: "rgba(255,255,255,0.08)",
        },
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#0F172A",
          950: "#1E3A5F",
        },
        success: {
          bg: "#F0FDF4",
          border: "#BBF7D0",
          text: "#16A34A",
          strong: "#059669",
        },
        warning: {
          bg: "#FFFBEB",
          border: "#FDE68A",
          text: "#B45309",
          strong: "#D97706",
        },
        danger: {
          bg: "#FEF2F2",
          border: "#FECACA",
          text: "#DC2626",
          strong: "#EF4444",
        },
        info: {
          bg: "#EFF6FF",
          border: "#BFDBFE",
          text: "#2563EB",
          strong: "#3B82F6",
        },
        neutral: {
          bg: "#F8FAFC",
          border: "#E2E8F0",
          text: "#475569",
        },
        text: {
          primary: "#0F172A",
          secondary: "#475569",
          tertiary: "#94A3B8",
          inverse: "#F1F5F9",
          muted: "#64748B",
        },
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        "2xl": "12px",
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        xs: ["11px", "16px"],
        sm: ["12px", "18px"],
        base: ["13px", "20px"],
        md: ["14px", "20px"],
        lg: ["15px", "22px"],
        xl: ["16px", "24px"],
        "2xl": ["18px", "26px"],
        "3xl": ["22px", "30px"],
      },
    },
  },
  plugins: [],
}

export default config
