import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

// The rules this project actually chose, kept apart from the recommended sets
// so they can be MERGED on top rather than replacing them.
//
// They used to sit in a `rules` key that followed `...pluginJs.configs.recommended`
// in the same object. A later key wins outright, so that one line silently
// discarded every recommended rule — no-undef among them. Nothing warned,
// because a lint config that checks less never fails.
const projectRules = {
  // unused-imports/* replaces the core rule and knows how to strip an import.
  "no-unused-vars": "off",
  "unused-imports/no-unused-imports": "error",
  "unused-imports/no-unused-vars": [
    "warn",
    { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" },
  ],
  "react/jsx-uses-vars": "error",
  "react/jsx-uses-react": "error",
  "react/prop-types": "off",
  "react/react-in-jsx-scope": "off",
  "react/no-unknown-property": ["error", { ignore: ["cmdk-input-wrapper", "toast-close"] }],
  "react-hooks/rules-of-hooks": "error",
  // A warning, not an error: a dependency list is sometimes deliberately narrow
  // (the checkout re-price runs once on entry, not on every cart edit), and
  // those cases carry a disable comment. Registering it also makes those
  // comments mean something — an unknown rule name is silently ignored.
  "react-hooks/exhaustive-deps": "warn",

  // Off deliberately. It guards against ambiguous quotes in JSX text, and this
  // site's copy is Hebrew prose full of legitimate ones — "קינג דיוויד",
  // ״מזרן״. It found 75 of them and a defect behind none: React escapes text
  // nodes regardless. Left on, it would mean entity-encoding every quotation
  // mark on every policy page, which is how a team learns to ignore lint.
  "react/no-unescaped-entities": "off",
};

const recommended = {
  ...pluginJs.configs.recommended.rules,
  ...pluginReact.configs.flat.recommended.rules,
};

export default [
  {
    // Everything the browser runs. src/lib and src/api were outside the old
    // `files` list and so had no rules applied at all — which is where both
    // pricing bugs lived.
    files: ["src/**/*.{js,mjs,cjs,jsx}"],
    // Vendored shadcn/ui components are upstream code, not ours to lint.
    ignores: ["src/components/ui/**/*"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: { ...recommended, ...projectRules },
  },
  {
    // Build config, one-off import scripts and the Vercel function: Node, no React.
    files: ["*.config.js", "scripts/**/*.{js,mjs}", "api/**/*.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 },
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    plugins: { "unused-imports": pluginUnusedImports },
    rules: {
      ...pluginJs.configs.recommended.rules,
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
    },
  },
];
