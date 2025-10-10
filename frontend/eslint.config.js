import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import globals from "globals";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
    },
    plugins: {
      react,
    },
    rules: {
      // ✅ JSX formatting rules
      "react/jsx-first-prop-new-line": ["error", "never"], // keep props on same line
      "react/jsx-max-props-per-line": ["error", { maximum: 3, when: "always" }], // adjust 3 → 1 for stricter
      "react/jsx-closing-bracket-location": ["error", "line-aligned"],
      "react/jsx-tag-spacing": [
        "error",
        {
          closingSlash: "never",
          beforeSelfClosing: "always",
          afterOpening: "never",
          beforeClosing: "never",
        },
      ],

      // 🧠 General React cleanup
      "react/react-in-jsx-scope": "off", // React 17+ doesn’t need import React
      "react/prop-types": "off", // using TypeScript, so not needed
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
