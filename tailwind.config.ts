import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta "informe de laboratorio": neutros fríos + acentos por estado.
        paper: '#F6F7F9',
        surface: '#FFFFFF',
        ink: '#13151A',
        muted: '#5B6270',
        line: '#E4E7EC',
        brand: {
          DEFAULT: '#5246E5',
          soft: '#ECEAFC',
          ink: '#3A2FB8',
        },
        warn: {
          DEFAULT: '#B7791F',
          soft: '#FBF1DD',
        },
        danger: {
          DEFAULT: '#C5453B',
          soft: '#FBE7E5',
        },
        ok: {
          DEFAULT: '#1F8A6B',
          soft: '#E0F2EC',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(19, 21, 26, 0.04), 0 8px 24px -16px rgba(19, 21, 26, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
