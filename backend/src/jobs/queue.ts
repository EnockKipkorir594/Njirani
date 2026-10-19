import { Queue } from 'bullmq';
import { createQueueRedisConnection } from '../config/redis.js';
import {
  NOTIFICATION_QUEUE_NAME,
  type NotificationJobData,
  type NotificationJobResult,
} from './notification.types.js';

export const notificationQueue = new Queue<
  NotificationJobData,
  NotificationJobResult,
  string
>(NOTIFICATION_QUEUE_NAME, {
  connection: createQueueRedisConnection(),

  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: 'exponential',
      delay: 1_000,
    },

    removeOnComplete: {
      age: 60 * 60,
      count: 1_000,
    },

    removeOnFail: {
      age: 24 * 60 * 60,
      count: 5_000,
    },
  },
});

notificationQueue.on('error', (error: Error) => {
  console.error('[Notification queue] Redis/BullMQ error:', error.message);
});