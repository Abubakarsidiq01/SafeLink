import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 30px -12px rgba(15, 23, 42, 0.25)',
      },
      colors: {
        brand: {
          DEFAULT: '#1d4ed8',
          dark: '#1e3a8a',
          light: '#3b82f6',
        },
      },
      backgroundImage: {
        'feed-gradient': 'radial-gradient(circle at top, rgba(37, 99, 235, 0.08), transparent 55%)',
      },
    },
  },
  plugins: [forms, typography],
}

