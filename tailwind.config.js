/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#121820',
          800: '#1B2430',
          700: '#2B3644',
        },
        cream: '#F2EFE7',
        muted: '#9AA5B1',
        amber: {
          DEFAULT: '#E3A83B',
          dark: '#B9832A',
        },
        pass: '#4CAF7D',
        fail: '#D9704F',
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
