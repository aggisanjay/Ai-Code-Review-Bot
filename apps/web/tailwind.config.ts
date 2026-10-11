import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#08090C',
        surface: {
          DEFAULT: '#0E1015',
          subtle: '#0B0C10',
          card: '#0F1117',
          elevated: '#141720',
          hover: '#181C26',
          active: '#1F2432',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.04)',
          'border-strong': 'rgba(255, 255, 255, 0.14)',
        },
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#B9DDFF',
          300: '#7CC2FF',
          400: '#36A2FF',
          500: '#2563EB', // Precision cobalt
          600: '#1D4ED8',
          700: '#1E40AF',
          accent: '#38BDF8', // Sky/ice highlight
        },
        status: {
          critical: '#F43F5E', // Rose 500
          high: '#F97316',     // Orange 500
          medium: '#F59E0B',   // Amber 500
          low: '#3B82F6',      // Blue 500
          safe: '#10B981',     // Emerald 500
          info: '#64748B',     // Slate 500
        },
        severity: {
          critical: '#F43F5E',
          high: '#F97316',
          medium: '#F59E0B',
          low: '#3B82F6',
          info: '#64748B',
          safe: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle-elevated': '0 1px 2px 0 rgba(0, 0, 0, 0.4), 0 4px 12px 0 rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'btn-primary': '0 1px 2px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
