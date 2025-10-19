import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import obsidianmd from "eslint-plugin-obsidianmd";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig(globalIgnores(["**/node_modules/", "**/main.js"]),{
    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        "obsidianmd": obsidianmd
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        parserOptions: {
            ecmaVersion: 14,
            sourceType: "module",
            project: "./tsconfig.json",
        },
    },

    rules: {
        "no-unused-vars": "off",

        "@typescript-eslint/no-unused-vars": ["error", {
            args: "none",
        }],

        "@typescript-eslint/ban-ts-comment": "off",
        "no-prototype-builtins": "off",
        "@typescript-eslint/no-empty-function": "off",
        "quotes": ["error", "double"],
        "semi": ["error", "always"],
        "curly": ["error", "all"],
        "no-eval": "error",
        "eqeqeq": ["error", "always"],
        "@typescript-eslint/no-base-to-string": "error",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/restrict-plus-operands": ["error", { skipCompoundAssignments: false }],
        "@typescript-eslint/restrict-template-expressions": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        ...obsidianmd.configs.recommended.rules
    },
});