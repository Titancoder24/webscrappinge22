import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
    './sidepanel.html',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forge: {
          bg: 'rgb(var(--forge-bg) / <alpha-value>)',
          'bg-secondary': 'rgb(var(--forge-bg-secondary) / <alpha-value>)',
          'bg-tertiary': 'rgb(var(--forge-bg-tertiary) / <alpha-value>)',
          surface: 'var(--forge-surface)',
          border: 'rgb(var(--forge-border) / <alpha-value>)',
          'border-active': 'rgb(var(--forge-border-active) / <alpha-value>)',
          text: 'rgb(var(--forge-text) / <alpha-value>)',
          'text-secondary': 'rgb(var(--forge-text-secondary) / <alpha-value>)',
          'text-muted': 'rgb(var(--forge-text-muted) / <alpha-value>)',
        },
        accent: {
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--accent-tertiary) / <alpha-value>)',
          glow: 'var(--accent-glow)',
        },
        status: {
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-beam': 'scanBeam 1.5s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'counter-roll': 'counterRoll 0.4s ease-out',
        'shockwave': 'shockwave 0.6s ease-out',
        'confetti': 'confetti 0.8s ease-out forwards',
        'radar-ping': 'radarPing 2s ease-out infinite',
        'float-badge': 'floatBadge 3s ease-in-out infinite',
        'typing': 'typing 0.05s steps(1)',
        'scanner': 'scanner 2s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px var(--accent-glow)' },
          '50%': { boxShadow: '0 0 25px var(--accent-glow)' },
        },
        scanBeam: {
          '0%': { backgroundPosition: '-100% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        counterRoll: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        shockwave: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
        radarPing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        floatBadge: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        scanner: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
