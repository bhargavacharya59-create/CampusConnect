import type { Config } from "tailwindcss";

// Colour tokens match the approved mockups.
// brand  = fixed theme (login, Dean, Parent)
// clear  = light theme for Director / Teacher / Student when nothing is pending
// alert  = red theme for Director / Teacher / Student when work is pending
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#14181F", muted: "#5B6270", soft: "#374151" },
        ground: "#F5F7F7",
        line: { DEFAULT: "#E1E7E6", soft: "#F0F2F4" },
        brand: {
          50: "#E3F2EF",
          100: "#BFE0DA",
          200: "#C7DEDA",
          600: "#0F766E",
          700: "#0B5C56",
          800: "#12524D",
          900: "#0B3D3A",
        },
        gold: { DEFAULT: "#F59E0B", ink: "#10201E" },
        alert: {
          50: "#FFF6F6",
          100: "#FDE8E7",
          200: "#F3B7B1",
          600: "#B91C1C",
          700: "#991B1B",
          800: "#8A1C12",
          900: "#7A1616",
        },
        ok: { 50: "#E3F4EA", 700: "#15803D", 900: "#14532D" },
        warn: { 50: "#FEF3C7", 800: "#9A3412", 900: "#78350F" },
        danger: "#B42318",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
