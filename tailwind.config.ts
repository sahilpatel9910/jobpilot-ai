import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        slateLine: "#d9e2ec",
        surface: "#f6f8fb",
        pilot: {
          50: "#eefcf8",
          100: "#d2f6ee",
          500: "#0f9f8f",
          600: "#087f73",
          700: "#075f58"
        },
        signal: "#c47f17"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
