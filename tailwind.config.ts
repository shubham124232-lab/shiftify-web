import type { Config } from "tailwindcss";

// Colour palette derived from shiftify-ebon.vercel.app — crimson-pink brand.
// Primary brand: deep magenta-crimson (#c01858). Emergency: red.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff0f5",
          100: "#ffe0ec",
          200: "#ffc0d9",
          300: "#ff8fb8",
          400: "#f95b92",
          500: "#f0306e",
          600: "#c01858",
          700: "#a01248",
          800: "#830e3c",
          900: "#5c0a2a",
          950: "#3d0620",
        },
        emergency: {
          50:  "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        accent: {
          pink:   "#f43f5e",
          violet: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card:     "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.08)",
        elevated: "0 4px 16px -2px rgb(0 0 0 / 0.08), 0 8px 24px -4px rgb(0 0 0 / 0.08)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #5c0a2a 0%, #a01248 55%, #c01858 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
