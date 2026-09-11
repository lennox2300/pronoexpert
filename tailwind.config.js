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
        page: '#0a0a0a',
        card: '#1a1a1a',
        border: '#2a2a2a',
        textmain: '#e8e8e8',
        textsec: '#aaa',
        texttert: '#666',
        brand: '#22c55e',
        wingreen: '#22c55e',
        losered: '#ef4444',
      },
    },
  },
  plugins: [],
};
