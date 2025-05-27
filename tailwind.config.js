// tailwind.config.js
const {heroui} = require("@heroui/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./node_modules/@heroui/theme/dist/components/scroll-shadow.js",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Figtree', 'sans-serif'],
      }
    }
  },
  darkMode: "class",
  plugins: [heroui()],
};