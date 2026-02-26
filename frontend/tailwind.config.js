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
        primary: {
          50:  '#E6F6FF',
          100: '#CCE9FF',
          200: '#99D3FF',
          300: '#66BDFF',
          400: '#33A7FF',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#06213a',
          900: '#041527',
        },
        ocean: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        navy: {
          DEFAULT: '#06213a',
          light: '#0a3355',
          dark: '#041527',
        },
        accent:  { 500: '#0ea5e9', 600: '#0284c7' },
        danger:  { 500: '#ef4444', 600: '#dc2626' },
        warning: { 500: '#f59e0b', 600: '#d97706' },
        safe:    { 500: '#10b981', 600: '#059669' },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(6, 33, 58, 0.10)',
        'glass-lg': '0 16px 48px rgba(6, 33, 58, 0.16)',
        'glass-inset': 'inset 0 1px 1px rgba(255,255,255,0.4)',
        'card-hover': '0 12px 40px rgba(14, 165, 233, 0.15)',
        'card-flip': '0 20px 60px rgba(6, 33, 58, 0.18)',
      },
      animation: {
        'pulse-safe': 'pulse-safe 2s ease-in-out infinite',
        'pulse-warn': 'pulse-warn 1.5s ease-in-out infinite',
        'pulse-danger': 'pulse-danger 1.2s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-safe': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.3)' },
          '50%': { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
        },
        'pulse-warn': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.3)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245, 158, 11, 0)' },
        },
        'pulse-danger': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.3)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
