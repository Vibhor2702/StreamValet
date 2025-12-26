/**** Tailwind config ****/
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        accent: '#14b8a6',
        muted: '#e2e8f0',
      },
    },
  },
  plugins: [],
};
