import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0284c7", // Sky 600
          foreground: "#ffffff",
          dark: "#0369a1",
        },
        bkash: {
          DEFAULT: "#e2136e",
          hover: "#c70d5e",
        },
        sslcommerz: {
          DEFAULT: "#1e3a8a",
          hover: "#172554",
        },
        carrybee: {
          DEFAULT: "#f59e0b",
          dark: "#d97706",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};
export default config;
