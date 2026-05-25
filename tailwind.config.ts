import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary:         "var(--clr-primary)",
        "primary-dark":  "var(--clr-primary-dark)",
        "primary-light": "var(--clr-primary-light)",
        "primary-xlight":"var(--clr-primary-xlight)",
        emergency:       "var(--clr-emergency)",
        "emergency-dark":"var(--clr-emergency-dark)",
        "shiftify-text": "var(--clr-text)",
        muted:           "var(--clr-muted)",
        "shiftify-border":"var(--clr-border)",
        surface:         "var(--clr-surface)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)", "sans-serif"],
        sans:    ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      borderRadius: {
        card: "var(--card-radius)",
        btn:  "var(--btn-radius)",
      },
      backgroundImage: {
        "hero-gradient":
          "linear-gradient(135deg, #fff 0%, #fff6f9 50%, #fce4ec 100%)",
        "dark-gradient":
          "linear-gradient(145deg, #1A1A2E 0%, #880E4F 60%, #C2185B 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
