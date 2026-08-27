/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'cv-bg':       '#171C10',
        'cv-sidebar':  '#10130A',
        'cv-card':     '#1E2416',
        // Text
        'cv-text':     '#F0EEE5',
        // Tier accents
        'cv-gold':     '#C2A064',
        'cv-gold-lt':  '#E9CF9C',
        'cv-steel':    '#8FA9BD',
        'cv-rose':     '#B4737B',
        'cv-rose-lt':  '#D8A3AA',
        // Orange (streak/notifications)
        'cv-orange':   '#E89147',
      },
      fontFamily: {
        sans:  ['"Saira Semi Condensed"', 'sans-serif'],
        serif: ['Newsreader', 'serif'],
      },
      borderRadius: {
        'cv': '14px',
        'cv-sm': '9px',
        'cv-lg': '16px',
      },
    },
  },
  plugins: [],
}
