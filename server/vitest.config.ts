import { fileURLToPath, URL } from 'url';
import { defineConfig } from 'vitest/config';

const alias = {
  '@src': fileURLToPath(new URL('./src', import.meta.url)),
  '@interfaces': fileURLToPath(new URL('../interfaces', import.meta.url)),
  '@tests': fileURLToPath(new URL('./src/tests', import.meta.url)),
};

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'routes',
          environment: 'node',
          include: ['src/routes/**/*.test.ts', 'src/app.test.ts'],
          setupFiles: ['./src/routes/test-setup.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/routes/**/*.test.ts', 'src/app.test.ts'],
        },
      },
    ],
  },
});
