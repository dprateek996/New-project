import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#0b0b0e',
          900: '#0f1117',
          850: '#141821',
          800: '#181c26',
          700: '#232938'
        },
        paper: {
          50: '#f8f5ef',
          100: '#f1ede5',
          200: '#e8e1d5'
        },
        accent: {
          400: '#c6a77d',
          500: '#b89062'
        }
      },
      boxShadow: {
        glow: '0 0 30px rgba(198, 167, 125, 0.18)',
        insetGlow: 'inset 0 0 0 1px rgba(255,255,255,0.08)'
      },
      backgroundImage: {
        grain: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\" viewBox=\"0 0 120 120\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.08\"/></svg>')"
      },
      fontFamily: {
        serif: ['var(--font-serif)'],
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)']
      }
    }
  },
  plugins: []
};

export default config;
