/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bat: {
          black: '#0a0a0f',
          night: '#0d0d12',
          dark: '#15151c',
          panel: '#1a1a22',
          border: '#252530',
          gray: '#2a2a35',
          muted: '#6a6a7a',
          silver: '#9a9aab',
          light: '#d4d4dc',
          white: '#f0f0f5',
          gold: '#FFD700',
          goldDark: '#e7c200',
          goldDarker: '#b89600',
          signal: '#FFC125',
        },
        gym: {
          red: '#8b5cf6',
          green: '#10b981',
          blue: '#3b82f6',
          orange: '#f97316',
          purple: '#8b5cf6',
        },
        nu: {
          bg: '#0d0d12',
          primary: '#8a2be2',
          secondary: '#a855f7',
          accent: '#c084fc',
        },
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'monospace'],
      },
      boxShadow: {
        bat: '0 0 20px rgba(255, 215, 0, 0.15)',
        batLg: '0 0 40px rgba(255, 215, 0, 0.2)',
        inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 215, 0, 0.25)' },
        },
      },
    },
  },
  plugins: [],
}