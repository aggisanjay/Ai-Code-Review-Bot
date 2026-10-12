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
        background: '#FFFFFF',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F7F9F8',
          card: '#FFFFFF',
          elevated: '#FFFFFF',
          muted: '#F0F3F1',
          hover: '#F2F5F3',
          active: '#E8EFEA',
          border: '#E4EAE6',
          'border-subtle': '#EEF3F0',
          'border-strong': '#CAD5CF',
        },
        sleek: {
          dark: '#14211D',
          text: '#14211D',
          muted: '#5C6661',
          subtle: '#88948E',
          surface: '#F7F9F8',
          border: '#E4EAE6',
          accent: '#126B50',
          'accent-hover': '#0B523D',
          'accent-surface': '#EAF5EF',
          'accent-light': '#F0F7F3',
        },
        brand: {
          50: '#F0F7F4',
          100: '#EAF5EF',
          200: '#C7E4D6',
          300: '#95CDB4',
          400: '#52AE8A',
          500: '#126B50', // Sleek Primary Forest Green
          600: '#0E5741',
          700: '#0B523D', // Accent Hover
          800: '#083D2D',
          900: '#05291E',
          accent: '#126B50',
        },
        status: {
          critical: '#DC2626',
          high: '#D97706',
          medium: '#2563EB',
          low: '#0284C7',
          safe: '#126B50',
          info: '#64748B',
        },
        severity: {
          critical: '#DC2626',
          high: '#D97706',
          medium: '#2563EB',
          low: '#0284C7',
          info: '#64748B',
          safe: '#126B50',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Manrope', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'sleek-sm': '0 1px 2px rgba(20, 33, 29, 0.04)',
        'sleek-md': '0 4px 16px -2px rgba(20, 33, 29, 0.06), 0 2px 6px -1px rgba(20, 33, 29, 0.03)',
        'sleek-lg': '0 12px 32px -4px rgba(20, 33, 29, 0.08), 0 4px 12px -2px rgba(20, 33, 29, 0.04)',
        'sleek-card': '0 1px 3px rgba(20, 33, 29, 0.04), 0 8px 24px -4px rgba(20, 33, 29, 0.05)',
        'sleek-card-hover': '0 12px 32px -4px rgba(18, 107, 80, 0.08), 0 4px 12px -2px rgba(20, 33, 29, 0.04)',
        'subtle-elevated': '0 2px 8px rgba(20, 33, 29, 0.05)',
        'card-hover': '0 10px 30px -5px rgba(20, 33, 29, 0.08)',
        'btn-primary': '0 1px 2px rgba(11, 82, 61, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
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
