/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
        colors: {
            primary: '#4C5FAB',
            secondary: '#F59E0B',
            background: '#F3F4F6',
            text: '#111827',
        },
        fontFamily: {
            kumbh: ['KumbhSans-Regular'],
            kumbhLight: ['KumbhSans-Light'],
            kumbhBold: ['KumbhSans-Bold'],
        },
    },
  },
  plugins: [],
}