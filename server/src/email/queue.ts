import { LanguageCode } from '@interfaces/survey';
import { getDb } from '@src/database';
import logger from '@src/logger';
import pgPromise from 'pg-promise';

export type EmailJobType = 'submission-report' | 'unfinished-submission';

export interface SubmissionReportJobPayload {
  submissionId: number;
  surveyId: number;
  to: string;
  language: LanguageCode;
  includeAttachments: boolean;
}

export interface UnfinishedSubmissionJobPayload {
  surveyId: number;
  to: string;
  token: string;
  language: LanguageCode;
}

interface EmailJobPayloadMap {
  'submission-report': SubmissionReportJobPayload;
  'unfinished-submission': UnfinishedSubmissionJobPayload;
}

interface EmailJobRow<T extends EmailJobType = EmailJobType> {
  id: number;
  type: T;
  payload: EmailJobPayloadMap[T];
  attempts: number;
}

type EmailJobHandler<T extends EmailJobType = EmailJobType> = (
  payload: EmailJobPayloadMap[T],
) => Promise<void>;

const handlers: Partial<Record<EmailJobType, EmailJobHandler>> = {};

const pollIntervalMs = Number(process.env.EMAIL_QUEUE_POLL_INTERVAL_MS) || 5000;
const defaultMaxAttempts = Number(process.env.EMAIL_QUEUE_MAX_ATTEMPTS) || 5;
const staleTimeoutMs =
  Number(process.env.EMAIL_QUEUE_STALE_TIMEOUT_MS) || 20 * 60 * 1000;

const backoffBaseMs = 30 * 1000;
const backoffCapMs = 60 * 60 * 1000;

// Delay doubles until backoffCap is reached
function backoffDelayMs(attempts: number) {
  return Math.min(backoffBaseMs * 2 ** (attempts - 1), backoffCapMs);
}

export function registerEmailJobHandler<T extends EmailJobType>(
  type: T,
  handler: EmailJobHandler<T>,
) {
  handlers[type] = handler;
}

export async function enqueueEmailJob<T extends EmailJobType>(
  type: T,
  payload: EmailJobPayloadMap[T],
  tx?: pgPromise.ITask<{}>,
) {
  const conn = tx ?? getDb();
  await conn.none(
    `
    INSERT INTO application.email_job (type, payload, max_attempts)
    VALUES ($(type), $(payload:json), $(maxAttempts))
    `,
    { type, payload, maxAttempts: defaultMaxAttempts },
  );
}

async function claimEmailJob() {
  return getDb().oneOrNone<EmailJobRow>(`
    UPDATE application.email_job
    SET status = 'processing', locked_at = now(), attempts = attempts + 1, updated_at = now()
    WHERE id = (
      SELECT id FROM application.email_job
      WHERE status = 'pending' AND run_at <= now()
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, type, payload, attempts
  `);
}

async function completeEmailJob(id: number) {
  await getDb().none(
    `UPDATE application.email_job SET status = 'sent', updated_at = now() WHERE id = $(id)`,
    { id },
  );
}

/**
 * Records a failed attempt. Retries with exponential backoff until
 * max_attempts is reached, after which the job is left 'failed' for manual
 * inspection instead of retried forever.
 */
async function failEmailJob(job: EmailJobRow, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await getDb().none(
    `
    UPDATE application.email_job
    SET
      status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
      run_at = now() + ($(delayMs) * interval '1 millisecond'),
      last_error = $(message),
      updated_at = now()
    WHERE id = $(id)
    `,
    { id: job.id, message, delayMs: backoffDelayMs(job.attempts) },
  );
}

/**
 * Resets jobs abandoned by a crashed worker (still 'processing' long after
 * being locked) back to 'pending' so a later poll picks them up again. This
 * is the actual crash-recovery mechanism: a claimed job that never reaches a
 * terminal status because its process died is otherwise invisible forever.
 */
async function reapStaleEmailJobs() {
  const reaped = await getDb().manyOrNone<{ id: number }>(
    `
    UPDATE application.email_job
    SET
      status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
      run_at = now(),
      last_error = 'Reaped after worker crash or timeout',
      updated_at = now()
    WHERE status = 'processing' AND locked_at < now() - ($(staleTimeoutMs) * interval '1 millisecond')
    RETURNING id
    `,
    { staleTimeoutMs },
  );
  if (reaped.length > 0) {
    logger.warn(`Reaped ${reaped.length} stale email job(s)`);
  }
}

async function processNextEmailJob() {
  const job = await claimEmailJob();
  if (!job) {
    return false;
  }
  try {
    const handler = handlers[job.type];
    if (!handler) {
      throw new Error(`No handler registered for email job type '${job.type}'`);
    }
    await handler(job.payload);
    await completeEmailJob(job.id);
  } catch (error) {
    logger.error(
      `Email job ${job.id} (${job.type}) failed on attempt ${job.attempts}: ${
        error instanceof Error ? error.message : error
      }`,
    );
    await failEmailJob(job, error);
  }
  return true;
}

async function pollOnce() {
  try {
    await reapStaleEmailJobs();
    // Drain everything currently due rather than only handling one job per interval tick
    while (await processNextEmailJob()) {
      // keep going
    }
  } catch (error) {
    logger.error(
      `Email queue poll failed: ${error instanceof Error ? error.message : error}`,
    );
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Idempotent, a module-level singleton set up once at server startup.
 */
export function initializeEmailQueueWorker() {
  if (pollTimer) {
    return;
  }
  pollTimer = setInterval(pollOnce, pollIntervalMs);
  // Run immediately instead of waiting out the first interval
  void pollOnce();
}

export function stopEmailQueueWorker() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
