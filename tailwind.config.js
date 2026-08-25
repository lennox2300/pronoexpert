/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Ticket charte graphique
        page: '#0d1117',
        card: '#161b22',
        border: '#21262d',
        textmain: '#ffffff',
        textsec: '#8a8f98',
        texttert: '#5c6370',
        brand: '#d4a72c',
        wingreen: '#3ddc84',
        losered: '#e5484d',
      },
    },
  },
  plugins: [],
};
