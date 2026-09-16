import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";

export default defineConfig([
    {
        ignores: ["node_modules/**", "dist/**", "coverage/**"],
    },
    {
        files: ["**/*.ts"],

        extends: [tseslint.configs.recommended],

        languageOptions: {
            globals: {
                ...globals.node,
            },

            parserOptions: {
                projectService: true,
            },
        },
    },
]);
