/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        allowance: {
          ink: '#172033',
          mint: '#2dbf8f',
          coral: '#f26d5b',
          gold: '#f5b84b'
        }
      }
    }
  },
  plugins: []
}
