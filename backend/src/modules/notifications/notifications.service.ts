import { notificationQueue } from '../../jobs/queue.js';

import {
  BOOKING_NOTIFICATION_JOB_NAME,
  type BookingNotificationEvent,
  type BookingNotificationJobData,
} from '../../jobs/notification.types.js';

interface EnqueueBookingNotificationInput {
  event: BookingNotificationEvent;
  bookingId: string;
  actorUserId: string;
}

/**
 * Adds a booking notification to BullMQ.
 *
 * The booking operation has already succeeded before this function
 * is called. Failure to enqueue is logged without turning that
 * successful booking operation into an HTTP error.
 */
export async function enqueueBookingNotification(
  input: EnqueueBookingNotificationInput,
): Promise<boolean> {
  const jobData: BookingNotificationJobData = {
    type: 'booking',
    event: input.event,
    bookingId: input.bookingId,
    actorUserId: input.actorUserId,
  };

  try {
    await notificationQueue.add(
      BOOKING_NOTIFICATION_JOB_NAME,
      jobData,
      {
        // Avoid duplicate enqueueing while this job is retained.
        // BullMQ custom job IDs must not contain colons.
        jobId: `booking_${input.event.toLowerCase()}_${input.bookingId}`,
      },
    );

    console.info('[Notifications] Job queued', {
      event: input.event,
      bookingId: input.bookingId,
    });

    return true;
  } catch (error) {
    console.error('[Notifications] Failed to enqueue job', {
      event: input.event,
      bookingId: input.bookingId,
      error,
    });

    return false;
  }
}