module.exports = {
  extends: ["standard", "prettier"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  globals: {
    fail: "readonly",
    NodeJS: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "no-dupe-class-members": "off", // Allow method overloads
  },
  ignorePatterns: [
    "lib/",
    "dist/",
    "coverage/",
    "node_modules/",
    "src/playground.ts"
  ],
}; 