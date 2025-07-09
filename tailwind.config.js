/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#0057A3',
        'secondary-blue': '#D6EBFF',
        'neutral-background-light': '#F8F9FA',
        'neutral-background-card': '#FFFFFF',
        'neutral-text-primary': '#212529',
        'neutral-text-secondary': '#6C757D',
        'green-informational': '#00B09B',
        'orange-highlight': '#FFA500',
        'pink-decorative': '#FFC0CB',
      },
    },
  },
  plugins: [],
}
