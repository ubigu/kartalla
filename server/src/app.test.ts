import type { Express } from 'express';
import { resolve } from 'path';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

const mockStaticRoot = resolve(__dirname, 'mockStatic');

vi.mock('./keyVaultSecrets', () => ({
  initSecrets: vi.fn(),
  secrets: {},
}));

vi.mock('./auth', () => ({
  configureAuth: vi.fn(),
  configureMockAuth: vi.fn(),
  ensureAuthenticated: () => (_req: any, _res: any, next: any) => next(),
}));

vi.mock('./database', () => ({
  initializeDatabase: vi.fn(),
  migrateUp: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock('./application/screenshot', () => ({
  initializePuppeteerCluster: vi.fn(),
}));

vi.mock('./routes', async () => {
  const { Router } = await import('express');
  return { default: Router() };
});

describe('no-cache headers on index.html routes', () => {
  let app: Express;

  beforeAll(async () => {
    const { createApp } = await import('./app.js');
    app = await createApp({
      staticRoot: mockStaticRoot,
      configureAuthFn: vi.fn(),
    });
  });

  it('sets Cache-Control: no-store on public route', async () => {
    const res = await request(app).get('/');
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('sets Cache-Control: no-store on admin route', async () => {
    const res = await request(app).get('/admin/dashboard');
    expect(res.headers['cache-control']).toContain('no-store');
  });
});
