import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "monospace"],
      },
      colors: {
        ink: { DEFAULT: "#14181f", soft: "#4b5563", faint: "#8b94a3" },
        line: { DEFAULT: "#e4e7ec", strong: "#cdd3dc" },
        canvas: "#f6f7f9",
        brand: { DEFAULT: "#0f766e", hover: "#0d6660", soft: "#e6f4f2" },
      },
      keyframes: {
        slideIn: { from: { transform: "translateX(24px)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
        pop: { from: { transform: "scale(.97)", opacity: "0" }, to: { transform: "none", opacity: "1" } },
      },
      animation: { slideIn: "slideIn .18s ease-out", pop: ".14s pop ease-out" },
    },
  },
  plugins: [],
};
export default config;
