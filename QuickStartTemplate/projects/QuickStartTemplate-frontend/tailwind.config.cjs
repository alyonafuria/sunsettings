/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Playfair Display', 'serif'],
        'serif': ['Playfair Display', 'serif'],
        'playfair': ['Playfair Display', 'serif'],
      }
    },
  },
  daisyui: {
    themes: ['lofi'],
    logs: false,
  },
  plugins: [require('daisyui')],
}
