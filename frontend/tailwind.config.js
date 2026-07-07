/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--tc-text)",
        clinic: "var(--tc-primary)",
        mist: "var(--tc-surface-muted)",
        coral: "var(--tc-accent)",
        alert: "var(--tc-error)",
        surface: "var(--tc-surface)",
        canvas: "var(--tc-bg)",
        border: "var(--tc-border)",
        success: "var(--tc-success)",
        warning: "var(--tc-warning)",
        info: "var(--tc-info)"
      },
      fontFamily: {
        sans: ["var(--tc-font-sans)"]
      },
      boxShadow: {
        panel: "var(--tc-shadow-lg)",
        card: "var(--tc-shadow-md)",
        lift: "var(--tc-shadow-lift)"
      },
      borderRadius: {
        "2xl": "var(--tc-radius-lg)",
        "3xl": "var(--tc-radius-xl)"
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    }
  },
  plugins: []
};
