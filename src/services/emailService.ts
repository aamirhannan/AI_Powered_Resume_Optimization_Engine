import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface SendEmailParams {
    from?: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
}

interface AuthParams extends SendEmailParams {
    user: string;
    pass: string;
}

class EmailService {
    constructor() {
        // Stateless service
    }

    // Removed init() as verified credentials are now required per-request

    async sendEmail({ from, to, subject, text, html, attachments = [] }: SendEmailParams): Promise<boolean> {
        // ... (Keep existing implementation for backward compatibility or remove if strictly moving to dynamic)
        // Ignoring existing implementation if logic is empty as per previous file
        return this._send(undefined, { from, to, subject, text, html, attachments });
    }

    async sendEmailWithAuth({ user, pass, to, subject, text, html, attachments = [] }: AuthParams): Promise<boolean> {
        const tempTransporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: { user, pass }
        });

        return this._send(tempTransporter, { from: user, to, subject, text, html, attachments });
    }

    async verifyCredentials(user: string, pass: string): Promise<boolean> {
        try {
            const tempTransporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // use STARTTLS
                auth: { user, pass }
            });
            await tempTransporter.verify();
            return true;
        } catch (error: any) {
            console.error('SMTP Credential Check Failed:', error.message);
            return false;
        }
    }

    async _send(transporter: Transporter | undefined, mailOptions: SendMailOptions): Promise<boolean> {
        if (!transporter) return false;
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent: %s', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error; // Propagate error so worker knows it failed
        }
    }
}

export const emailService = new EmailService();
