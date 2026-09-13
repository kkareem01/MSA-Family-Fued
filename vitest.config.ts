import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*', 'scripts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.*',
        '**/test/**',
        '**/main.ts',
        '**/main.tsx',
        '**/*.d.ts',
        'packages/web/src/sound/synth/**',
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      reporter: ['text', 'html'],
    },
  },
});
