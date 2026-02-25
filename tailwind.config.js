/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        'ls-primary': '#0b3d2e',
        'ls-secondary': '#0f5b43',
        'ls-dark': '#0f172a',
        'ls-card': '#1e293b',
        'ls-accent': '#22c55e',
        'ls-highlight': '#34d399',
        'ls-red': '#ef4444'
      }
    },
  },
  plugins: [],
}