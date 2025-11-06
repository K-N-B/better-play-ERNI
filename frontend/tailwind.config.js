const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  mode: 'jit',
  // These paths are just examples, customize them to match your project structure
  theme: {
    extend: {
      // --- THIS IS THE CHANGE ---
      fontFamily: {
        // Change 'Source Sans 3' to 'Poppins'
        sans: ['Poppins', ...defaultTheme.fontFamily.sans],
      },
      // ---

      // ... (your other theme extensions like colors) ...
    },
  },
  purge: [
    './public/**/*.html',
    './src/**/*.{js,jsx,ts,tsx,vue}',
    './node_modules/flowbite/**/*.js',
  ],
  plugins: [require('flowbite/plugin')],
};
