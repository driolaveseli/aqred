const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        "toast-in": {
          "0%":   { opacity: "0", transform: "translateY(8px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "translateY(28px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%":      { transform: "translate(30px, -20px) scale(1.05)" },
          "66%":      { transform: "translate(-20px, 15px) scale(0.97)" },
        },
        "border-glow": {
          "0%, 100%": { opacity: "0.35" },
          "50%":      { opacity: "0.7" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.8s ease both",
        "scale-in": "scale-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both",
        float: "float 6s ease-in-out infinite",
        "drift-slow": "drift 22s ease-in-out infinite",
        "drift-slower": "drift 30s ease-in-out infinite",
        "border-glow": "border-glow 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
