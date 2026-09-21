import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        accent: {
          DEFAULT: "#A15C1F",
          hover: "#8A4D18",
          foreground: "#FFFDF9",
        },
        risk: {
          critical: "#B42318",
          high: "#B54708",
          medium: "#8A6500",
          low: "#15803D",
        },
      },
      boxShadow: {
        "diffuse-sm": "0 1px 2px rgba(20,19,18,0.04), 0 1px 1px rgba(20,19,18,0.02)",
        diffuse: "0 6px 20px rgba(20,19,18,0.05), 0 1px 2px rgba(20,19,18,0.04)",
        "diffuse-lg": "0 16px 40px rgba(20,19,18,0.08), 0 2px 6px rgba(20,19,18,0.05)",
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 600ms cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
