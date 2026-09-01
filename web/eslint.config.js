import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
    {
        ignores: ['dist/**', 'dev-dist/**', 'coverage/**', 'public/**'],
    },
    js.configs.recommended,
    ...pluginVue.configs['flat/recommended'],
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser },
        },
    },
    {
        files: ['eslint.config.js', 'vite.config.js', 'vitest.config.js'],
        languageOptions: {
            globals: { ...globals.node },
        },
    },
    prettier,
]
