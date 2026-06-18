/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        charcoal: "#1a1a1a",
        gold: "#C9A96E",
        ivory: "#FAFAF5",
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Noto Sans SC", "sans-serif"],
      },
    },
  },
  plugins: [],
};
