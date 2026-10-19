import prisma from '../../config/database.js';
import {
  type BookingNotificationJobData,
  type BookingNotificationJobResult,
} from '../../jobs/notification.types.js';
import { sendEmail } from '../../services/email.service.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface NotificationContent {
  recipientUserId: string;
  subject: string;
  introduction: string;
  cancellationActor?: 'resident' | 'provider';
}

export async function deliverBookingNotification(
  data: BookingNotificationJobData,
): Promise<BookingNotificationJobResult> {
  // Fetch only the booking fields required for this email.
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
    select: {
      id: true,
      residentId: true,
      providerId: true,
      description: true,
      scheduledAt: true,
    },
  });

  if (!booking) {
    throw new Error(
      `Cannot send notification: booking ${data.bookingId} was not found`,
    );
  }

  let content: NotificationContent;

  switch (data.event) {
    case 'BOOKING_CREATED': {
      if (data.actorUserId !== booking.residentId) {
        throw new Error(
          'Invalid actor for booking-created notification',
        );
      }

      content = {
        recipientUserId: booking.providerId,
        subject: 'New booking request on Njirani',
        introduction:
          'A resident has submitted a new service booking request.',
      };
      break;
    }

    case 'BOOKING_ACCEPTED': {
      if (data.actorUserId !== booking.providerId) {
        throw new Error(
          'Invalid actor for booking-accepted notification',
        );
      }

      content = {
        recipientUserId: booking.residentId,
        subject: 'Your booking has been accepted',
        introduction:
          'Your service provider has accepted your booking request.',
      };
      break;
    }

    case 'BOOKING_DECLINED': {
      if (data.actorUserId !== booking.providerId) {
        throw new Error(
          'Invalid actor for booking-declined notification',
        );
      }

      content = {
        recipientUserId: booking.residentId,
        subject: 'Booking request update',
        introduction:
          'The provider has declined your booking request.',
      };
      break;
    }

    case 'BOOKING_CANCELLED': {
      if (data.actorUserId === booking.residentId) {
        content = {
          recipientUserId: booking.providerId,
          subject: 'Booking cancelled on Njirani',
          introduction:
            'A booking assigned to you has been cancelled.',
          cancellationActor: 'resident',
        };
      } else if (data.actorUserId === booking.providerId) {
        content = {
          recipientUserId: booking.residentId,
          subject: 'Your booking has been cancelled',
          introduction:
            'Your service provider has cancelled the booking.',
          cancellationActor: 'provider',
        };
      } else {
        throw new Error(
          'Invalid actor for booking-cancelled notification',
        );
      }

      break;
    }

    default: {
      const unexpectedEvent: never = data.event;
      throw new Error(
        `Unsupported booking event: ${unexpectedEvent}`,
      );
    }
  }

  const recipient = await prisma.user.findUnique({
    where: { id: content.recipientUserId },
    select: { email: true },
  });

  if (!recipient?.email) {
    throw new Error(
      `Notification recipient ${content.recipientUserId} has no email address`,
    );
  }

  const scheduledAt = booking.scheduledAt?.toLocaleString(
    'en-KE',
    {
      timeZone: 'Africa/Nairobi',
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  );

  const cancellationDetails = content.cancellationActor
    ? `\nCancelled by: ${content.cancellationActor}`
    : '';

  const text = [
    'Hello,',
    '',
    content.introduction,
    '',
    `Service description: ${booking.description || 'N/A'}`,
    `Scheduled for: ${scheduledAt ?? 'N/A'}`,
    `Booking reference: ${booking.id}`,
    cancellationDetails,
    '',
    'This is an automated notification from Njirani.',
  ]
    .filter(Boolean)
    .join('\n');

  // The description originates from a user, so escape it before
  // inserting it into HTML email content.
  const html = `
    <h2>${escapeHtml(content.subject)}</h2>
    <p>Hello,</p>
    <p>${escapeHtml(content.introduction)}</p>
    <p>
      <strong>Service description:</strong>
      ${escapeHtml(booking.description || '')}
    </p>
    <p>
      <strong>Scheduled for:</strong>
      ${escapeHtml(scheduledAt || 'N/A')}
    </p>
    <p>
      <strong>Booking reference:</strong>
      ${escapeHtml(booking.id)}
    </p>
    ${
      content.cancellationActor
        ? `<p><strong>Cancelled by:</strong> ${content.cancellationActor}</p>`
        : ''
    }
    <p>This is an automated notification from Njirani.</p>
  `;

  const emailResult = await sendEmail({
    to: recipient.email,
    subject: content.subject,
    text,
    html,
  });

  const normalizedRecipient = recipient.email.toLowerCase();

  const wasAccepted = emailResult.accepted.some(
    (address) => address.toLowerCase() === normalizedRecipient,
  );

  const wasRejected = emailResult.rejected.some(
    (address) => address.toLowerCase() === normalizedRecipient,
  );

  if (!wasAccepted || wasRejected) {
    throw new Error(
      `SMTP did not accept notification for ${recipient.email}`,
    );
  }

  return {
    message: `Booking notification ${data.event} submitted successfully`,
    messageId: emailResult.messageId,
    recipient: recipient.email,
    processedAt: new Date().toISOString(),
  };
}