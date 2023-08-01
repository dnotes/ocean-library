const typography = require("@tailwindcss/typography");

/** @type {import('tailwindcss').Config}*/
const config = {
  content: ["./src/**/*.{html,js,svelte,ts}"],

  theme: {
    fontFamily: {
      'sans': ['"Ysabeau Office"', 'sans-serif'],
    },
    extend: {
      fontWeight: {
        'normal': 300,
      },
    },
  },

  plugins: [typography],
};

module.exports = config;
