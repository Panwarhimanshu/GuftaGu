import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ── Neumorphism Design System ─────────────────────────
      colors: {
        // Base surface colors
        neu: {
          50:  '#f0f0f3',
          100: '#e8e8eb',
          200: '#d1d1d6',
          300: '#b0b0b8',
          400: '#8e8e98',
          500: '#6c6c78',
          600: '#555560',
          700: '#3f3f47',
          800: '#2a2a30',
          900: '#1a1a1f',
          950: '#0d0d10',
        },
        // Brand colors
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Accent — vibrant purple
        accent: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Status colors
        online:  '#22c55e',
        busy:    '#ef4444',
        away:    '#f59e0b',
        offline: '#6b7280',
        // Hangout button colors
        smoke:   '#94a3b8',
        coffee:  '#92400e',
        lunch:   '#15803d',
        gaming:  '#7c3aed',
        walk:    '#0891b2',
        hangout: '#db2777',
      },

      // ── Neumorphism Shadows ───────────────────────────────
      boxShadow: {
        // Light mode neumorphism
        'neu-flat':    '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff',
        'neu-pressed': 'inset 6px 6px 12px #b8b9be, inset -6px -6px 12px #ffffff',
        'neu-convex':  '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff, inset 1px 1px 2px #ffffff, inset -1px -1px 2px #b8b9be',
        'neu-concave': '6px 6px 12px #b8b9be, -6px -6px 12px #ffffff, inset -1px -1px 2px #ffffff, inset 1px 1px 2px #b8b9be',
        'neu-sm':      '3px 3px 6px #b8b9be, -3px -3px 6px #ffffff',
        'neu-lg':      '10px 10px 20px #b8b9be, -10px -10px 20px #ffffff',
        'neu-xl':      '15px 15px 30px #b8b9be, -15px -15px 30px #ffffff',
        // Dark mode neumorphism
        'neu-dark-flat':    '6px 6px 12px #141416, -6px -6px 12px #242428',
        'neu-dark-pressed': 'inset 6px 6px 12px #141416, inset -6px -6px 12px #242428',
        'neu-dark-sm':      '3px 3px 6px #141416, -3px -3px 6px #242428',
        'neu-dark-lg':      '10px 10px 20px #141416, -10px -10px 20px #242428',
        // Colored glows
        'brand-glow': '0 0 20px rgba(59,130,246,0.4)',
        'accent-glow': '0 0 20px rgba(168,85,247,0.4)',
        'online-glow': '0 0 10px rgba(34,197,94,0.5)',
      },

      // ── Border Radius ─────────────────────────────────────
      borderRadius: {
        'neu':    '16px',
        'neu-sm': '10px',
        'neu-lg': '24px',
        'neu-xl': '32px',
      },

      // ── Typography ────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      // ── Animations ────────────────────────────────────────
      animation: {
        'fade-in':       'fadeIn 0.3s ease-in-out',
        'fade-up':       'fadeUp 0.4s ease-out',
        'slide-in-right':'slideInRight 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-ring':    'pulseRing 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'wiggle':        'wiggle 0.5s ease-in-out',
        'scale-in':      'scaleIn 0.2s ease-out',
        'typing':        'typing 1.2s steps(3,end) infinite',
        'presence-ping': 'presencePing 1.5s ease-out infinite',
      },
      keyframes: {
        fadeIn:      { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp:      { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight:{ '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
        slideInLeft: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(0)' } },
        bounceGentle:{ '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseRing:   { '0%': { boxShadow: '0 0 0 0 rgba(59,130,246,0.4)' }, '70%': { boxShadow: '0 0 0 10px rgba(59,130,246,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(59,130,246,0)' } },
        wiggle:      { '0%,100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } },
        scaleIn:     { '0%': { transform: 'scale(0.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        typing:      { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        presencePing:{ '0%': { transform: 'scale(1)', opacity: '1' }, '100%': { transform: 'scale(2)', opacity: '0' } },
      },

      // ── Backdrop Blur ─────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

export default config;
