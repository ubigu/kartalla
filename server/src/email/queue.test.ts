import { buildMockDb } from '@src/tests/helpers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loggerMock } = vi.hoisted(() => ({
  loggerMock: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@src/database', () => ({ getDb: vi.fn() }));
vi.mock('@src/logger', () => ({ default: loggerMock }));

import { getDb } from '@src/database';

// Flushes the microtask queue - the poller's initial run isn't itself
// awaited by the caller (see initializeEmailQueueWorker), so tests need to
// wait for its chained promises without relying on fake timers.
function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

let mockDb: ReturnType<typeof buildMockDb>;
let mod: typeof import('./queue.js');

async function loadModule() {
  vi.resetModules();
  mod = await import('./queue.js');
  return mod;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDb = buildMockDb();
  vi.mocked(getDb).mockReturnValue(mockDb as any);
});

afterEach(() => {
  mod?.stopEmailQueueWorker();
  delete process.env.EMAIL_QUEUE_MAX_ATTEMPTS;
  delete process.env.EMAIL_QUEUE_POLL_INTERVAL_MS;
  delete process.env.EMAIL_QUEUE_STALE_TIMEOUT_MS;
});

describe('enqueueEmailJob', () => {
  it('inserts a pending job with the default max attempts via getDb() when no transaction is given', async () => {
    const { enqueueEmailJob } = await loadModule();

    await enqueueEmailJob('unfinished-submission', {
      surveyId: 1,
      to: 'someone@example.com',
      token: 'abc',
      language: 'fi',
    });

    expect(mockDb.none).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO application.email_job'),
      {
        type: 'unfinished-submission',
        payload: {
          surveyId: 1,
          to: 'someone@example.com',
          token: 'abc',
          language: 'fi',
        },
        maxAttempts: 5,
      },
    );
  });

  it('respects EMAIL_QUEUE_MAX_ATTEMPTS', async () => {
    process.env.EMAIL_QUEUE_MAX_ATTEMPTS = '3';
    const { enqueueEmailJob } = await loadModule();

    await enqueueEmailJob('submission-report', {
      submissionId: 1,
      surveyId: 1,
      to: 'a@example.com',
      language: 'fi',
      includeAttachments: false,
    });

    expect(mockDb.none.mock.calls[0][1].maxAttempts).toBe(3);
  });

  it('inserts through the given transaction instead of getDb()', async () => {
    const { enqueueEmailJob } = await loadModule();
    const tx = { none: vi.fn().mockResolvedValue(undefined) };

    await enqueueEmailJob(
      'submission-report',
      {
        submissionId: 1,
        surveyId: 1,
        to: 'a@example.com',
        language: 'fi',
        includeAttachments: true,
      },
      tx as any,
    );

    expect(tx.none).toHaveBeenCalledTimes(1);
    expect(mockDb.none).not.toHaveBeenCalled();
  });
});

describe('the queue worker', () => {
  it('claims a job, runs its handler, and marks it sent', async () => {
    const { registerEmailJobHandler, initializeEmailQueueWorker } =
      await loadModule();
    const handler = vi.fn().mockResolvedValue(undefined);
    registerEmailJobHandler('submission-report', handler);

    const job = {
      id: 1,
      type: 'submission-report',
      payload: {
        submissionId: 1,
        surveyId: 1,
        to: 'a@example.com',
        language: 'fi',
        includeAttachments: false,
      },
      attempts: 1,
    };
    mockDb.manyOrNone.mockResolvedValueOnce([]); // reaper: nothing stale
    mockDb.oneOrNone
      .mockResolvedValueOnce(job) // first claim
      .mockResolvedValueOnce(null); // drain loop ends

    initializeEmailQueueWorker();
    await flushPromises();

    expect(handler).toHaveBeenCalledWith(job.payload);
    expect(mockDb.none).toHaveBeenCalledWith(
      expect.stringContaining("status = 'sent'"),
      { id: 1 },
    );
  });

  it('backs off and re-queues a job whose handler throws, without exceeding max attempts', async () => {
    const { registerEmailJobHandler, initializeEmailQueueWorker } =
      await loadModule();
    registerEmailJobHandler(
      'submission-report',
      vi.fn().mockRejectedValue(new Error('smtp unavailable')),
    );

    const job = {
      id: 2,
      type: 'submission-report',
      payload: {
        submissionId: 1,
        surveyId: 1,
        to: 'a@example.com',
        language: 'fi',
        includeAttachments: false,
      },
      attempts: 2,
    };
    mockDb.manyOrNone.mockResolvedValueOnce([]);
    mockDb.oneOrNone.mockResolvedValueOnce(job).mockResolvedValueOnce(null);

    initializeEmailQueueWorker();
    await flushPromises();

    expect(mockDb.none).toHaveBeenCalledWith(
      expect.stringContaining('CASE WHEN attempts >= max_attempts'),
      { id: 2, message: 'smtp unavailable', delayMs: 60000 }, // attempt 2 -> 30s * 2^1
    );
    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining('Email job 2 (submission-report) failed'),
    );
  });

  it('fails a job with no registered handler instead of leaving it stuck', async () => {
    const { initializeEmailQueueWorker } = await loadModule();

    const job = {
      id: 3,
      type: 'unfinished-submission',
      payload: {
        surveyId: 1,
        to: 'a@example.com',
        token: 'abc',
        language: 'fi',
      },
      attempts: 1,
    };
    mockDb.manyOrNone.mockResolvedValueOnce([]);
    mockDb.oneOrNone.mockResolvedValueOnce(job).mockResolvedValueOnce(null);

    initializeEmailQueueWorker();
    await flushPromises();

    expect(mockDb.none).toHaveBeenCalledWith(expect.any(String), {
      id: 3,
      message:
        "No handler registered for email job type 'unfinished-submission'",
      delayMs: 30000,
    });
  });

  it('logs and reschedules jobs abandoned by a crashed worker', async () => {
    const { initializeEmailQueueWorker } = await loadModule();
    mockDb.manyOrNone.mockResolvedValueOnce([{ id: 4 }, { id: 5 }]); // reaper: two stale jobs found
    mockDb.oneOrNone.mockResolvedValueOnce(null); // nothing new to claim

    initializeEmailQueueWorker();
    await flushPromises();

    expect(mockDb.manyOrNone).toHaveBeenCalledWith(
      expect.stringContaining("status = 'processing'"),
      expect.objectContaining({ staleTimeoutMs: 20 * 60 * 1000 }),
    );
    expect(loggerMock.warn).toHaveBeenCalledWith('Reaped 2 stale email job(s)');
  });

  it('only starts one interval no matter how many times it is initialized', async () => {
    const { initializeEmailQueueWorker } = await loadModule();
    mockDb.manyOrNone.mockResolvedValue([]); // reaper: nothing stale
    mockDb.oneOrNone.mockResolvedValue(null); // nothing to claim
    const setIntervalSpy = vi.spyOn(global, 'setInterval');

    initializeEmailQueueWorker();
    initializeEmailQueueWorker();
    await flushPromises();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it('stopEmailQueueWorker clears the interval so a later initialize can start a fresh one', async () => {
    const { initializeEmailQueueWorker, stopEmailQueueWorker } =
      await loadModule();
    mockDb.manyOrNone.mockResolvedValue([]); // reaper: nothing stale
    mockDb.oneOrNone.mockResolvedValue(null); // nothing to claim
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    initializeEmailQueueWorker();
    await flushPromises();
    stopEmailQueueWorker();
    initializeEmailQueueWorker();
    await flushPromises();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
  });

  it('never lets a poll failure escape as an unhandled rejection', async () => {
    const { initializeEmailQueueWorker } = await loadModule();
    mockDb.manyOrNone.mockRejectedValueOnce(new Error('connection lost')); // reaper query itself fails

    expect(() => initializeEmailQueueWorker()).not.toThrow();
    await flushPromises();

    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.stringContaining('Email queue poll failed: connection lost'),
    );
  });
});
