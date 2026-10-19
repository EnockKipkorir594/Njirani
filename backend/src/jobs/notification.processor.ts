import 'dotenv/config';

import { Worker } from 'bullmq';
import { createWorkerRedisConnection } from '../config/redis.js';

import {
  NOTIFICATION_QUEUE_NAME,
  TEST_NOTIFICATION_JOB_NAME,
  BOOKING_NOTIFICATION_JOB_NAME,
  type NotificationJobData,
  type NotificationJobResult,
} from './notification.types.js';

import { deliverBookingNotification } from
  '../modules/notifications/notifications.delivery.js';

const redisConnection = createWorkerRedisConnection();

const notificationWorker = new Worker<
  NotificationJobData,
  NotificationJobResult,
  string
>(
  NOTIFICATION_QUEUE_NAME,

  async (job) => {
    if (job.name === TEST_NOTIFICATION_JOB_NAME) {
      if (job.data.type !== 'test') {
        throw new Error('Invalid test notification payload');
      }

      console.log(
        `[Notification worker] Processing job ${job.id}:`,
        job.data.message,
      );

      return {
        message: `Processed test notification: ${job.data.message}`,
        processedAt: new Date().toISOString(),
      };
    }

    if (job.name === BOOKING_NOTIFICATION_JOB_NAME) {
      if (job.data.type !== 'booking') {
        throw new Error('Invalid booking notification payload');
      }

      console.log(
        `[Notification worker] Delivering ${job.data.event}`,
        { bookingId: job.data.bookingId, jobId: job.id },
      );

      return deliverBookingNotification(job.data);
    }

    throw new Error(`Unsupported notification job: ${job.name}`);
  },

  {
    connection: redisConnection,
    concurrency: 5,
  },
);

notificationWorker.on('ready', () => {
  console.log('[Notification worker] Ready and waiting for jobs');
});

notificationWorker.on('completed', (job, result) => {
  console.log(
    `[Notification worker] Job ${job.id} completed`,
    result,
  );
});

notificationWorker.on('failed', (job, error) => {
  console.error(
    `[Notification worker] Job ${job?.id ?? 'unknown'} failed`,
    { error: error.message },
  );
});

notificationWorker.on('error', (error) => {
  console.error('[Notification worker] Worker error:', error.message);
});

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;

  isShuttingDown = true;
  console.log(`[Notification worker] Received ${signal}; shutting down`);

  try {
    await notificationWorker.close();

    if (
      redisConnection.status !== 'end' &&
      redisConnection.status !== 'close'
    ) {
      await redisConnection.quit();
    }

    console.log('[Notification worker] Shutdown complete');
  } catch (error) {
    console.error('[Notification worker] Shutdown failed:', error);
    process.exitCode = 1;
  }
}

process.once('SIGINT', () => {
  void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM');
});