import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { BadRequestError } from '@src/error';
import { createTestApp } from './test-setup';

const scanUploadedFileMock = vi.fn();

vi.mock('@src/malwareScan', () => ({
  scanUploadedFile: () => scanUploadedFileMock,
}));

let app: Express;

beforeAll(async () => {
  app = await createTestApp();
});

describe('POST /api/svg-icon', () => {
  it('rejects the upload when malware scanning flags the file', async () => {
    scanUploadedFileMock.mockImplementationOnce((_req, _res, next) => {
      next(
        new BadRequestError(
          'File failed malware scan',
          undefined,
          'malware_detected',
        ),
      );
    });

    const res = await request(app)
      .post('/api/svg-icon')
      .attach('file', Buffer.from('<svg></svg>'), 'icon.svg');

    expect(res.status).toBe(400);
    expect(res.body.message_code).toBe('malware_detected');
  });

  it('runs the scan step before falling through to the auth check', async () => {
    scanUploadedFileMock.mockImplementationOnce((_req, _res, next) => next());

    const res = await request(app)
      .post('/api/svg-icon')
      .attach('file', Buffer.from('<svg></svg>'), 'icon.svg');

    expect(scanUploadedFileMock).toHaveBeenCalled();
    expect(res.status).toBe(401);
  });
});
