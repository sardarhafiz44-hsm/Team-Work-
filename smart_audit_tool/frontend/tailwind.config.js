/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#0a0a12",       // Deep Space Black
          gray: "#161622",       // Card Background
          primary: "#00f3ff",    // Neon Cyan (Text/Buttons)
          secondary: "#7000ff",  // Neon Purple (Highlights)
          danger: "#ff003c",     // Red for Bugs
          success: "#00ff9d",    // Green for Safe Code
        }
      },
      boxShadow: {
        'neon': '0 0 10px rgba(0, 243, 255, 0.5), 0 0 20px rgba(0, 243, 255, 0.3)',
        'neon-red': '0 0 10px rgba(255, 0, 60, 0.5), 0 0 20px rgba(255, 0, 60, 0.3)',
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace'], // Hacker style font for code
      }
    },
  },
  plugins: [],
}