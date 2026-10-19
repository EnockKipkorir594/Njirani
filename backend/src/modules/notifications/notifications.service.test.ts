import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addMock } = vi.hoisted(() => ({
  addMock: vi.fn(),
}));

vi.mock('../../jobs/queue.js', () => ({
  notificationQueue: {
    add: addMock,
  },
}));

import { enqueueBookingNotification } from './notifications.service.js';
import { BOOKING_NOTIFICATION_JOB_NAME } from '../../jobs/notification.types.js';
import type { BookingNotificationEvent } from '../../jobs/notification.types.js';

const bookingId = 'booking-123';
const actorUserId = 'user-456';

const events: BookingNotificationEvent[] = [
  'BOOKING_CREATED',
  'BOOKING_ACCEPTED',
  'BOOKING_DECLINED',
  'BOOKING_CANCELLED',
];

describe('enqueueBookingNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(events)(
    'queues the $0 event with the expected payload',
    async (event) => {
      addMock.mockResolvedValueOnce({ id: 'test-job-id' });

      const result = await enqueueBookingNotification({
        event,
        bookingId,
        actorUserId,
      });

      expect(result).toBe(true);

      expect(addMock).toHaveBeenCalledOnce();
      expect(addMock).toHaveBeenCalledWith(
        BOOKING_NOTIFICATION_JOB_NAME,
        {
          type: 'booking',
          event,
          bookingId,
          actorUserId,
        },
        {
          jobId: `booking_${event.toLowerCase()}_${bookingId}`,
        },
      );
    },
  );

  it('returns false and logs when adding the job fails', async () => {
    const errorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      addMock.mockRejectedValueOnce(
        new Error('Redis unavailable'),
      );

      const result = await enqueueBookingNotification({
        event: 'BOOKING_CREATED',
        bookingId,
        actorUserId,
      });

      expect(result).toBe(false);

      expect(errorSpy).toHaveBeenCalledWith(
        '[Notifications] Failed to enqueue job',
        expect.objectContaining({
          event: 'BOOKING_CREATED',
          bookingId,
        }),
      );
    } finally {
      errorSpy.mockRestore();
    }
  });
});