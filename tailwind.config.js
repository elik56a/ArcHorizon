/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blueprint: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#334e68',
          900: '#05121e',
        },
        paper: '#ffffff', 
        ink: '#000000',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px rgba(0,0,0,1)',
        'hard-sm': '2px 2px 0px 0px rgba(0,0,0,1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'progress': 'progress 2s infinite linear',
        'draw': 'draw 1.5s ease-out forwards',
        'pop-in': 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'wash-in': 'washIn 1s ease-out forwards',
        'stamp-in': 'stampIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        progress: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        draw: {
          '0%': { strokeDasharray: '0, 5000', opacity: '1' },
          '100%': { strokeDasharray: '5000, 0', opacity: '1' }
        },
        popIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        washIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        stampIn: {
          '0%': { transform: 'scale(1.2)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}