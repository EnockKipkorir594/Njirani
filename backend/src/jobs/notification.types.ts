export const NOTIFICATION_QUEUE_NAME = 'notifications';

export const TEST_NOTIFICATION_JOB_NAME = 'test.notification';

export const BOOKING_NOTIFICATION_JOB_NAME =
  'booking.notification';

export type BookingNotificationEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_DECLINED'
  | 'BOOKING_CANCELLED';

export interface TestNotificationJobData {
  type: 'test';
  message: string;
}

export interface BookingNotificationJobData {
  type: 'booking';
  event: BookingNotificationEvent;
  bookingId: string;
  actorUserId: string;
}

export type NotificationJobData =
  | TestNotificationJobData
  | BookingNotificationJobData;

export interface TestNotificationJobResult {
  message: string;
  processedAt: string;
}

export interface BookingNotificationJobResult {
  message: string;
  messageId: string;
  recipient: string;
  processedAt: string;
}

export type NotificationJobResult =
  | TestNotificationJobResult
  | BookingNotificationJobResult;