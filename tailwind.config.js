/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#4CAF50',
          'green-dark': '#388E3C',
          'green-light': '#81C784',
          mint: '#E8F0E5',
          'mint-dark': '#D4E8CE',
          charcoal: '#1C1C1E',
          'charcoal-light': '#2C2C2E',
        },
        category: {
          lifestyle: '#4CAF50',
          keto: '#E91E8C',
          performance: '#2196F3',
          plantbased: '#FF6F00',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
