import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Separate config from vite.config.js so test runs don't pull in
// the ESLint + Tailwind plugins. Alias below must mirror the alias
// in vite.config.js and the paths entry in tsconfig.json.
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, '_scripts'),
    },
  },
  test: {
    // happy-dom is ~3x faster than jsdom and covers the APIs our
    // components touch. Observer polyfills live in vitest.setup.ts.
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['tests/setup/vitest.setup.ts'],
    include: [
      '_scripts/**/*.test.ts',
      'tests/unit/**/*.test.ts',
    ],
    // Playwright (Tier 3) lives in tests/e2e/ — never run by Vitest.
    exclude: ['node_modules', 'tests/e2e/**'],
  },
})
