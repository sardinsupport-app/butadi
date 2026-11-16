import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dikbud: {
          navy: "#0F2C59",
          blue: "#1E40AF",
          gold: "#F59E0B",
          tosca: "#0D9488",
          light: "#F8FAFC",
        },
      },
    },
  },
  plugins: [],
};
export default config;
