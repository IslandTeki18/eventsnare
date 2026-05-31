import { mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Test config lives here, not in vite.config.ts, because vitest 2.x depends on
// Vite 5 while the app builds against Vite 6. Keeping the `test` block out of the
// Vite-6-typed vite.config.ts avoids the dual-version type clash during `tsc -b`.
// This file is intentionally excluded from the tsconfig build graph.
export default mergeConfig(viteConfig, {
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
