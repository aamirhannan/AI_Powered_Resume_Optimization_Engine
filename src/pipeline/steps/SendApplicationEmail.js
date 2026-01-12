import { Step } from '../Step.js';
import { emailService } from '../../services/emailService.js';

import path from 'path';

export class SendApplicationEmail extends Step {
    constructor() {
        super('SendApplicationEmail');
    }

    async execute(context) {
        const { targetEmail, emailSubject, coverLetter, pdfPath } = context;

        if (!targetEmail) {
            throw new Error('Target email is missing in context.');
        }

        console.log(`Sending email to ${targetEmail}...`);

        const success = await emailService.sendEmail({
            to: targetEmail,
            subject: emailSubject || 'Job Application',
            text: coverLetter || 'Please find my resume attached.',
            attachments: pdfPath ? [{
                path: pdfPath,
                filename: path.basename(pdfPath)
            }] : []
        });

        if (!success) {
            throw new Error('Failed to send email.');
        }

        return {
            ...context,
            emailSent: true
        };
    }
}
