import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#7c5cff",
          dark: "#5b3df0",
        },
        surface: "#0b0b14",
        surfaceAlt: "#13131f",
      },
    },
  },
  plugins: [],
};

export default config;
