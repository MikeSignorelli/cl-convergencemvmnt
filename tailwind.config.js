/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        ink: '#171C10',
        'ink-alt': '#131710',
        'ink-deep': '#0F1309',
        card: '#1C2214',
        paper: '#F4F2EC',
        // Text
        cream: '#F0EEE5',
        'cream-solid': '#F5F2E9',
        charcoal: '#23281A',
        // Accent
        gold: '#C2A064',
        'gold-dark': '#A6843C',
      },
      fontFamily: {
        sans: ['"Saira Semi Condensed"', 'sans-serif'],
        serif: ['Newsreader', 'serif'],
      },
      borderRadius: {
        cv: '14px',
        'cv-sm': '9px',
        'cv-lg': '16px',
      },
    },
  },
  plugins: [],
}
