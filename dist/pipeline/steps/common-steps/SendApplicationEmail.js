import { Step } from '#pipeline/Step';
import { emailService } from '#services/emailService';
import path from 'path';
export class SendApplicationEmail extends Step {
    constructor() {
        super('SendApplicationEmail');
    }
    async execute(context) {
        const { targetEmail, emailSubject, coverLetter, pdfPath, appPassword, email } = context;
        if (!targetEmail) {
            throw new Error('Target email is missing in context.');
        }
        // Sanitize email: Convert "fancy" styles (bold/italic) to standard text
        const sanitizedEmail = targetEmail.normalize('NFKC').trim();
        console.log(`Sending email to ${sanitizedEmail}...`);
        let success;
        if (appPassword && email) {
            console.log('Using provided App Password for SMTP...');
            success = await emailService.sendEmailWithAuth({
                user: email, // The applicant's email (sender)
                pass: appPassword, // Ensure this is definitely a string in context
                to: sanitizedEmail,
                subject: emailSubject || 'Job Application',
                text: coverLetter || 'Please find my resume attached.',
                attachments: pdfPath ? [{
                        path: pdfPath,
                        filename: path.basename(pdfPath)
                    }] : []
            });
        }
        else {
            // Fallback
            success = await emailService.sendEmail({
                to: sanitizedEmail,
                subject: emailSubject || 'Job Application',
                text: coverLetter || 'Please find my resume attached.',
                attachments: pdfPath ? [{
                        path: pdfPath,
                        filename: path.basename(pdfPath)
                    }] : []
            });
        }
        if (!success) {
            throw new Error('Failed to send email.');
        }
        return {
            ...context,
            emailSent: true
        };
    }
}
