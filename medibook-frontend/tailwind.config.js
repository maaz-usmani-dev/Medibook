/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blue:        '#1A6EBF',
        'blue-dark': '#115091',
        'blue-mid':  '#2680D4',
        'blue-light':'#EBF5FF',
        'blue-pale': '#F0F7FF',
        teal:        '#0ABFBC',
        'teal-light':'#E6FAFA',
        green:       '#11B080',
        'green-light':'#E6F9F4',
        amber:       '#F59E0B',
        'amber-light':'#FEF3C7',
        red:         '#E53935',
        'red-light': '#FFEBEE',
        purple:      '#7C3AED',
        'purple-light':'#F3EEFF',
        dark:        '#0D1B2A',
        navy:        '#0F2549',
        'navy-mid':  '#1A3A6B',
        slate:       '#4A5E7A',
        muted:       '#7A8FA6',
        border:      '#E2EAF4',
        bg:          '#F5F8FD',
        'bg-card':   '#FAFCFF',
      },
      fontFamily: {
        fraunces: ['Fraunces', 'serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 4px rgba(13,27,42,0.06), 0 4px 16px rgba(13,27,42,0.05)',
        md: '0 4px 12px rgba(13,27,42,0.08), 0 12px 32px rgba(13,27,42,0.07)',
        lg: '0 8px 24px rgba(13,27,42,0.10), 0 24px 64px rgba(13,27,42,0.09)',
      },
      borderRadius: {
        DEFAULT: '14px',
        sm: '8px',
        lg: '20px',
        full: '999px',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease both',
        'fade-in': 'fadeIn 0.4s ease both',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
    },
  },
  plugins: [],
};
