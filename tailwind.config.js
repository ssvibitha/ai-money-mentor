/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        softgreen: '#f0fdf4',
        primary: '#16a34a',
        secondary: '#22c55e',
      },
      boxShadow: {
        soft: '0 8px 28px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}

