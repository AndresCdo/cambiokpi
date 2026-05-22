/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f0f13",
          card: "#1a1a24",
          border: "#2d2d3d",
        },
        primary: {
          DEFAULT: "#7c3aed",
          hover: "#6d28d9",
        },
        profit: "#22c55e",
        loss: "#ef4444",
        text: {
          primary: "#f8fafc",
          secondary: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
