import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    __CONTENT_MANIFEST_PATH__: JSON.stringify('content/manifest.json'),
    __CONTENT_VERSION__: JSON.stringify('test'),
    __CONTENT_BUILD_ID__: JSON.stringify('test'),
    __APP_MODE__: JSON.stringify('test'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      include: ['src/engine/**', 'src/content/**'],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
