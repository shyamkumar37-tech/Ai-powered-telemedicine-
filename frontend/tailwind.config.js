/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0B1121",
        surface: "#151E32",
        primary: "#14B8A6",
        live: "#38BDF8",
        alert: "#E11D48",
        ink: {
          DEFAULT: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
        mono: ["'Roboto Mono'", "monospace"]
      },
      boxShadow: {
        premium: "0 10px 40px -10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        panel: "var(--tc-shadow-lg)",
        card: "var(--tc-shadow-md)",
        lift: "var(--tc-shadow-lift)"
      },
      borderRadius: {
        "2xl": "var(--tc-radius-lg)",
        "3xl": "var(--tc-radius-xl)",
        card: "16px",
        element: "8px"
      },
      animation: {
        pulseBorder: 'pulseBorder 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite'
      },
      keyframes: {
        pulseBorder: {
          '0%, 100%': { borderColor: 'rgba(56, 189, 248, 0.2)' },
          '50%': { borderColor: 'rgba(56, 189, 248, 0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        }
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    }
  },
  plugins: []
};
