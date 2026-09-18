/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        botanical: {
          50: '#FBFBF9',
          100: '#F7F6F2',
          200: '#EFECE3',
          300: '#E2DECFC',
          400: '#C9C4B2',
          DEFAULT: '#F9F8F5',
        },
        evergreen: {
          900: '#0B1611',
          800: '#0F1D17',
          700: '#162A21',
          DEFAULT: '#0F1D17',
        },
        forest: {
          600: '#1B4332',
          500: '#2D6A4F',
          400: '#40916C',
          DEFAULT: '#1B4332',
        },
        limeaccent: {
          500: '#84CC16',
          400: '#A3E635',
          DEFAULT: '#84CC16',
        },
        earth: {
          100: '#E8E5DA',
          200: '#DDD8C8',
          border: '#E5E3D8',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
