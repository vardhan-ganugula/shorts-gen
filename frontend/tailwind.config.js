/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090A0F",
        surface: "#12141F",
        surfaceLight: "#1E2235",
        primary: "#6366F1", // Klap indigo
        primaryHover: "#4F46E5",
        accent: "#10B981", // Emerald viral green
        warning: "#F59E0B",
        cardBorder: "#272A3E",
      },
    },
  },
  plugins: [],
}
