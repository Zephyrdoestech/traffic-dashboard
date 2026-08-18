/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          white: 'rgba(255,255,255,0.12)',
          dark: 'rgba(15,23,42,0.6)',
          accent: 'rgba(56,189,248,0.15)',
        },
      },
    },
  },
  plugins: [],
};
