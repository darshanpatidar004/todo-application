/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Luxury/Elite theme colors (Elite Dark / Luxury Slate)
        primary: "#3B82F6",
        background: "#0B0F19",
        card: "#151D30",
        border: "#1E293B",
        text: "#F8FAFC",
        muted: "#64748B",
      }
    },
  },
  plugins: [],
}
