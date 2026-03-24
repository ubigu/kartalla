import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addMapPublication,
  deleteMapPublication,
  getMapPublication,
  getMapPublications,
} from '@src/application/mapPublications';
import {
  adminOrgA,
  adminOrgB,
  createTestApp,
  loginAs,
  regularUser,
} from './test-setup';

vi.mock('@src/application/mapPublications', () => ({
  getMapPublications: vi.fn().mockResolvedValue([]),
  getMapPublication: vi.fn().mockResolvedValue(null),
  addMapPublication: vi.fn().mockResolvedValue({ id: 'new-uuid' }),
  deleteMapPublication: vi.fn().mockResolvedValue(undefined),
}));

const mocks = {
  getMapPublications: vi.mocked(getMapPublications),
  getMapPublication: vi.mocked(getMapPublication),
  addMapPublication: vi.mocked(addMapPublication),
  deleteMapPublication: vi.mocked(deleteMapPublication),
};

let app: Express;

beforeAll(async () => {
  app = await createTestApp();
});

describe('GET /api/map-publications', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app).get('/api/map-publications');
    expect(res.status).toBe(401);
  });

  it('returns 200 for authenticated user', async () => {
    const agent = await loginAs(app, regularUser);
    const res = await agent.get('/api/map-publications');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/map-publications', () => {
  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/map-publications')
      .send({ name: 'Test', url: 'https://example.com/map' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const agent = await loginAs(app, regularUser);
    const res = await agent
      .post('/api/map-publications')
      .send({ name: 'Test', url: 'https://example.com/map' });
    expect(res.status).toBe(403);
  });

  it('returns 201 for admin user with valid body', async () => {
    const agent = await loginAs(app, adminOrgA);
    const res = await agent
      .post('/api/map-publications')
      .send({ name: 'Test', url: 'https://example.com/map' });
    expect(res.status).toBe(201);
  });

  it('returns 400 when url is missing', async () => {
    const agent = await loginAs(app, adminOrgA);
    const res = await agent
      .post('/api/map-publications')
      .send({ name: 'Test' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/map-publications/:id', () => {
  const publicationId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

  beforeEach(() => {
    mocks.getMapPublication.mockReset();
  });

  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app).delete(
      `/api/map-publications/${publicationId}`,
    );
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    const agent = await loginAs(app, regularUser);
    const res = await agent.delete(`/api/map-publications/${publicationId}`);
    expect(res.status).toBe(403);
  });

  it('returns 404 when publication does not exist', async () => {
    const agent = await loginAs(app, adminOrgA);
    const res = await agent.delete(`/api/map-publications/${publicationId}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 when admin deletes a publication from another organization', async () => {
    mocks.getMapPublication.mockResolvedValueOnce({
      id: publicationId,
      name: 'Test',
      url: 'https://example.com/map',
      organization: 'org-a',
    });
    const agent = await loginAs(app, adminOrgB);
    const res = await agent.delete(`/api/map-publications/${publicationId}`);
    expect(res.status).toBe(403);
  });

  it('returns 204 when admin deletes a publication from their own organization', async () => {
    mocks.getMapPublication.mockResolvedValueOnce({
      id: publicationId,
      name: 'Test',
      url: 'https://example.com/map',
      organization: 'org-a',
    });
    const agent = await loginAs(app, adminOrgA);
    const res = await agent.delete(`/api/map-publications/${publicationId}`);
    expect(res.status).toBe(204);
  });
});
