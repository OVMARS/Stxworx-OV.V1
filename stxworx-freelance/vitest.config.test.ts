import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // So tests can import from '../lib/...' as used in components
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'jsdom',
    globals: true,
    root: path.resolve(__dirname),
  },
});
