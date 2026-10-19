import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findBooking: vi.fn(),
  findUser: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock('../../config/database.js', () => ({
  default: {
    booking: {
      findUnique: mocks.findBooking,
    },
    user: {
      findUnique: mocks.findUser,
    },
  },
}));

vi.mock('../../services/email.service.js', () => ({
  sendEmail: mocks.sendEmail,
}));

import { deliverBookingNotification } from './notifications.delivery.js';
import type { BookingNotificationEvent } from '../../jobs/notification.types.js';

const booking = {
  id: 'booking-123',
  residentId: 'resident-123',
  providerId: 'provider-456',
  description: 'The kitchen sink is leaking',
  scheduledAt: new Date('2026-12-01T09:00:00.000Z'),
};

const deliveryCases: Array<{
  event: BookingNotificationEvent;
  actorUserId: string;
  recipientUserId: string;
  recipientEmail: string;
  subject: string;
}> = [
  {
    event: 'BOOKING_CREATED',
    actorUserId: 'resident-123',
    recipientUserId: 'provider-456',
    recipientEmail: 'provider@example.com',
    subject: 'New booking request on Njirani',
  },
  {
    event: 'BOOKING_ACCEPTED',
    actorUserId: 'provider-456',
    recipientUserId: 'resident-123',
    recipientEmail: 'resident@example.com',
    subject: 'Your booking has been accepted',
  },
  {
    event: 'BOOKING_DECLINED',
    actorUserId: 'provider-456',
    recipientUserId: 'resident-123',
    recipientEmail: 'resident@example.com',
    subject: 'Booking request update',
  },
  {
    event: 'BOOKING_CANCELLED',
    actorUserId: 'resident-123',
    recipientUserId: 'provider-456',
    recipientEmail: 'provider@example.com',
    subject: 'Booking cancelled on Njirani',
  },
  {
    event: 'BOOKING_CANCELLED',
    actorUserId: 'provider-456',
    recipientUserId: 'resident-123',
    recipientEmail: 'resident@example.com',
    subject: 'Your booking has been cancelled',
  },
];

describe('deliverBookingNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.findBooking.mockResolvedValue(booking);

    mocks.findUser.mockResolvedValue({
      email: 'provider@example.com',
    });

    mocks.sendEmail.mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['provider@example.com'],
      rejected: [],
    });
  });

  it.each(deliveryCases)(
    'sends $event to the correct participant',
    async (scenario) => {
      mocks.findUser.mockResolvedValueOnce({
        email: scenario.recipientEmail,
      });

      mocks.sendEmail.mockResolvedValueOnce({
        messageId: 'test-message-id',
        accepted: [scenario.recipientEmail],
        rejected: [],
      });

      const result = await deliverBookingNotification({
        type: 'booking',
        event: scenario.event,
        bookingId: booking.id,
        actorUserId: scenario.actorUserId,
      });

      expect(mocks.findUser).toHaveBeenCalledWith({
        where: { id: scenario.recipientUserId },
        select: { email: true },
      });

      expect(mocks.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: scenario.recipientEmail,
          subject: scenario.subject,
        }),
      );

      expect(result).toMatchObject({
        messageId: 'test-message-id',
        recipient: scenario.recipientEmail,
      });
    },
  );

  it('rejects a notification when the booking does not exist', async () => {
    mocks.findBooking.mockResolvedValueOnce(null);

    await expect(
      deliverBookingNotification({
        type: 'booking',
        event: 'BOOKING_CREATED',
        bookingId: booking.id,
        actorUserId: booking.residentId,
      }),
    ).rejects.toThrow(/booking.*not found/i);

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects a booking-created event with the wrong actor', async () => {
    await expect(
      deliverBookingNotification({
        type: 'booking',
        event: 'BOOKING_CREATED',
        bookingId: booking.id,
        actorUserId: 'unrelated-user',
      }),
    ).rejects.toThrow(/invalid actor/i);

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects delivery when the recipient has no email address', async () => {
    mocks.findUser.mockResolvedValueOnce(null);

    await expect(
      deliverBookingNotification({
        type: 'booking',
        event: 'BOOKING_CREATED',
        bookingId: booking.id,
        actorUserId: booking.residentId,
      }),
    ).rejects.toThrow(/no email address/i);

    expect(mocks.sendEmail).not.toHaveBeenCalled();
  });

  it('fails when SMTP rejects the recipient', async () => {
    mocks.sendEmail.mockResolvedValueOnce({
      messageId: 'test-message-id',
      accepted: [],
      rejected: ['provider@example.com'],
    });

    await expect(
      deliverBookingNotification({
        type: 'booking',
        event: 'BOOKING_CREATED',
        bookingId: booking.id,
        actorUserId: booking.residentId,
      }),
    ).rejects.toThrow(/SMTP did not accept/i);
  });
});