/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd7ff',
          300: '#8ebeff',
          400: '#599aff',
          500: '#3376f4',
          600: '#1f5ae0',
          700: '#1b47b8',
          800: '#1c3e94',
          900: '#1d3875',
        },
        ink: {
          50: '#f7f8fa',
          100: '#eef0f4',
          200: '#dce0e8',
          300: '#b8c0cf',
          400: '#8e9bb1',
          500: '#687894',
          600: '#52617b',
          700: '#414d63',
          800: '#2c3547',
          900: '#1b2232',
          950: '#111624',
        },
        accent: {
          50: '#fff8eb',
          100: '#ffefc6',
          200: '#ffdd88',
          300: '#ffc54a',
          400: '#ffad1f',
          500: '#f78b06',
          600: '#db6702',
          700: '#b64706',
          800: '#93370c',
          900: '#792e0d',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 16px rgba(27, 34, 50, 0.06)',
        card: '0 8px 30px rgba(27, 34, 50, 0.08)',
        lift: '0 18px 50px rgba(27, 34, 50, 0.14)',
        glow: '0 12px 40px rgba(31, 90, 224, 0.28)',
      },
      borderRadius: {
        '2xl': '1.15rem',
        '3xl': '1.6rem',
        '4xl': '2rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'slide-down': 'slideDown 0.25s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'scale-in': 'scaleIn 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};
