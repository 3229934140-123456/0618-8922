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
        charcoal: {
          DEFAULT: "#1a1a1a",
          light: "#2a2a2a",
        },
        gold: {
          DEFAULT: "#C9A96E",
          light: "#D9BB85",
        },
        ivory: "#FAFAF5",
        warm: {
          gray: "#F2EDE4",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Noto Sans SC", "sans-serif"],
      },
    },
  },
  plugins: [],
};
