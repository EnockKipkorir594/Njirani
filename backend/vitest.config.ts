// backend/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
   
    pool: 'forks',
    testTimeout: 15000,
    globals: true,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-for-testing-only',
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_EXPIRES_IN: '7d',
      DATABASE_URL: 'postgresql://njirani:njirani_dev_pass@localhost:5432/njirani_test',
      PORT: '8001',
    },
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'src/generated'],
  },
})