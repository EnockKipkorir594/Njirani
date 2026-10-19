import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const smtpAuth =
    env.SMTP_USER && env.SMTP_PASSWORD
        ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
          }
        : undefined;

// Create one reusable transporter for this process.
const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(smtpAuth ? { auth: smtpAuth } : {}),
});

export interface SendEmailInput {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export async function verifyEmailTransport(): Promise<void> {
    await transporter.verify();
}

export async function sendEmail(
    message: SendEmailInput,
): Promise<{
    messageId: string;
    accepted: string[];
    rejected: string[];
}> {
    const result = await transporter.sendMail({
        from: env.SMTP_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
    });

    return {
        messageId: result.messageId,
        accepted: result.accepted.map(String),
        rejected: result.rejected.map(String),
    };
}