import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: "#0d1117",
          panel: "#161b22",
          accent: "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
