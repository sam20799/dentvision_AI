/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['Rajdhani', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        bg: {
          DEFAULT: '#020408',
          2: '#060d14',
        },
        cyan: '#00D4FF',
        'blue-brand': '#3B8BEB',
        gold: '#C8943A',
      },
      animation: {
        'scan': 'scanline 2s linear infinite',
        'rotate-ring': 'rotate-ring 3s linear infinite',
        'float': 'float-particle 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
