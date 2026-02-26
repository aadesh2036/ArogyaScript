/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#4f46e5', 700: '#4338ca' },
        accent: { 500: '#10b981', 600: '#059669' },
        danger: { 500: '#ef4444', 600: '#dc2626' },
        warning: { 500: '#f59e0b' },
      },
    },
  },
  plugins: [],
};
