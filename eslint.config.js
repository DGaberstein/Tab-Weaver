// ESLint configuration (legacy format for ESLint 8.x)
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    webextensions: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks'
  ],
  globals: {
    chrome: 'readonly',
    performance: 'readonly',
    globalThis: 'readonly'
  },
  settings: {
    react: {
      version: '18.3'
    }
  },
  rules: {
    // Modern JS rules
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'object-shorthand': 'error',
    
    // TypeScript rules
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // React rules
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    'packages/**',
    '*.config.js'
  ]
};