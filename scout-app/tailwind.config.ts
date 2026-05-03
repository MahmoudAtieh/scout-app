import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-tajawal)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#15803d",
          light: "#86efac",
          dark: "#166534",
        },
      },
    },
  },
  plugins: [],
};

export default config;
