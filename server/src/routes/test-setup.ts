import type { Express } from 'express';
import request from 'supertest';
import { vi } from 'vitest';
import { configureTestAuth } from '../auth';

// ─── Shared mocks ────────────────────────────────────────────────────────────
// Declared here so route test files need zero vi.mock() calls for these.

vi.mock('../keyVaultSecrets', () => ({
  secrets: {},
  initSecrets: vi.fn(),
}));

vi.mock('../database', () => ({
  getDb: vi.fn(),
  initializeDatabase: vi.fn(),
  migrateUp: vi.fn(),
  encryptionKey: 'test-key',
}));

vi.mock('../application/survey', () => ({
  getPublicationAccesses: vi.fn(),
  getSurveyOrganizationAndGroups: vi.fn(),
}));

vi.mock('../logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.spyOn(console, 'error').mockImplementation(() => {});

vi.stubEnv('AUTH_ENABLED', 'true');

// ─── User fixtures ────────────────────────────────────────────────────────────

export const adminOrgA: Express.User = {
  id: 'user-1',
  fullName: 'Admin A',
  email: 'admin@orga.fi',
  organizations: [{ id: 'org-a', name: 'Org A' }],
  roles: ['organization_admin'],
  groups: [],
};

export const regularUser: Express.User = {
  id: 'user-2',
  fullName: 'Regular User',
  email: 'user@orga.fi',
  organizations: [{ id: 'org-a', name: 'Org A' }],
  roles: ['organization_user'],
  groups: [],
};

export const adminOrgB: Express.User = {
  id: 'user-3',
  fullName: 'Admin B',
  email: 'admin@orgb.fi',
  organizations: [{ id: 'org-b', name: 'Org B' }],
  roles: ['organization_admin'],
  groups: [],
};

// ─── App / session helpers ────────────────────────────────────────────────────

export async function createTestApp() {
  // Dynamic import here so tha vi mocks get applied before loading all routes
  const { createApp } = await import('../app.js');
  return createApp({ configureAuthFn: configureTestAuth });
}

export async function loginAs(app: Express, user: Express.User) {
  const agent = request.agent(app);
  await agent.post('/test-login').send(user).expect(200);
  return agent;
}
