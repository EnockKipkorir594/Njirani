import 'dotenv/config';

import {
    sendEmail,
    verifyEmailTransport,
} from '../services/email.service.js';

async function main(): Promise<void> {
    console.log('Verifying SMTP connection...');

    await verifyEmailTransport();

    console.log('SMTP connection verified.');

    const result = await sendEmail({
        to: 'developer@njirani.local',
        subject: 'Njirani email transport test',
        text: [
            'Hello from Njirani!',
            '',
            'This is a local email-delivery smoke test.',
            'It was sent through Nodemailer and captured by Mailpit.',
        ].join('\n'),
        html: `
            <h1>Hello from Njirani!</h1>
            <p>This is a local email-delivery smoke test.</p>
            <p>It was sent through Nodemailer and captured by Mailpit.</p>
        `,
    });

    console.log('Email accepted by SMTP server.');
    console.log('Message ID:', result.messageId);
    console.log('Accepted recipients:', result.accepted);
    console.log('Rejected recipients:', result.rejected);

    if (result.rejected.length > 0) {
        throw new Error('The SMTP server rejected the recipient.');
    }
}

main().catch((error: unknown) => {
    console.error('Email smoke test failed:', error);
    process.exitCode = 1;
});