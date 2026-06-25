import nextPlugin from "eslint-config-next";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextPlugin,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      '.history/**',
      '.agent/**',
      '.claude/**',
      '.cursor/**',
      '.omc/**',
      '.trae/**',
      '.vscode/**',
      'dist/**',
      'out/**',
      'public/**',
      'coverage/**',
      '*.config.*',
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      // React 19/Next.js 16 기본 규칙 중 기존 코드베이스와 충돌하는 규칙 완화
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
