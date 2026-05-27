/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        nunito: ["var(--font-nunito)", "Nunito", "sans-serif"],
        serif: ["var(--font-dm-serif)", "DM Serif Display", "serif"],
      },
      colors: {
        patient: {
          bg: "#EAF6F6",
          primary: "#2C7873",
          secondary: "#52AB98",
          accent: "#F7B731",
          text: "#1A2E2E",
          card: "#FFFFFF",
          border: "#B2DFDB",
        },
        care: {
          bg: "#F4F7FE",
          primary: "#4361EE",
          secondary: "#3A0CA3",
          accent: "#F72585",
          success: "#06D6A0",
          warning: "#FFB703",
          danger: "#EF233C",
          text: "#1A1A2E",
          card: "#FFFFFF",
          border: "#E2E8F0",
          muted: "#94A3B8",
        },
      },
      animation: {
        "slide-up": "slide-up 0.5s ease forwards",
        "fade-in": "fade-in 0.4s ease forwards",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        "slide-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.06)",
        card: "0 2px 12px rgba(0,0,0,0.08)",
        "card-hover": "0 8px 30px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
    },
  },
  plugins: [],
};