/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Light mode
        bg:    'var(--bg)',
        bg2:   'var(--bg2)',
        bg3:   'var(--bg3)',
        sf:    'var(--sf)',
        sf2:   'var(--sf2)',
        br:    'var(--br)',
        br2:   'var(--br2)',
        dk:    'var(--dk)',
        dk2:   'var(--dk2)',
        ac:    'var(--ac)',
        ac2:   'var(--ac2)',
        tx:    'var(--tx)',
        tx2:   'var(--tx2)',
        tx3:   'var(--tx3)',
        danger:'var(--re)',
        ok:    'var(--gr)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        s1: '0 1px 4px rgba(0,0,0,.06),0 2px 8px rgba(0,0,0,.04)',
        s2: '0 4px 20px rgba(0,0,0,.09)',
        s3: '0 14px 50px rgba(0,0,0,.14)',
      },
      animation: {
        up:    'slideUp .28s ease',
        ni:    'slideIn .22s ease',
        spin:  'spin .85s linear infinite',
        pulse: 'pulse 3s infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
