/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        light: {
          primary: '#5E9978',
          secondary: '#D8EDE1',
          'text-primary': '#1A1A1A',
          'text-secondary': '#484C52',
          background: '#FAFAFA',
        },
        dark: {
          primary: '#86C19D',
          secondary: '#2A3B31',
          'text-primary': '#FAFAFA',
          'text-secondary': '#B0B0B0',
          background: '#1A1A1A',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
