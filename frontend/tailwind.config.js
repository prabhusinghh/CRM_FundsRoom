/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1B2430',
          soft: '#2E3A4A',
          muted: '#42505F',
        },
        kraft: {
          DEFAULT: '#C1793A',
          dark: '#A6632A',
          light: '#F1DFC9',
        },
        canvas: '#F6F3EC',
        surface: '#FFFFFF',
        slate: {
          DEFAULT: '#5B6B7A',
          light: '#DDD8CC',
          50: '#F4F2EC',
        },
        depot: {
          DEFAULT: '#3F7859',
          bg: '#E7F0EA',
        },
        signal: {
          DEFAULT: '#B54334',
          bg: '#F7E7E3',
        },
        warn: {
          DEFAULT: '#B8862B',
          bg: '#F3E9D2',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(27, 36, 48, 0.06), 0 1px 3px 0 rgba(27, 36, 48, 0.08)',
        lift: '0 4px 12px 0 rgba(27, 36, 48, 0.12)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
