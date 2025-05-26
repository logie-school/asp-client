import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-unused-vars": "off", // Disable unused variables rule
      "@typescript-eslint/no-unused-vars": "off", // Disable TypeScript unused variables rule
      "@typescript-eslint/no-explicit-any": "off", // Disable explicit 'any' rule
      "react-hooks/exhaustive-deps": "off", // Disable exhaustive dependencies rule
      "react/no-unescaped-entities": "off", // Disable unescaped entities rule
      "prefer-const": "off", // Disable the prefer-const rule
    },
  },
];

export default eslintConfig;
