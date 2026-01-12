import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class EmailService {
    constructor() {
        this.transporter = null;
        this.init();
    }

    init() {
        if (process.env.PROD_SMTP_EMAIL && process.env.PROD_SMTP_PASSWORD) {
            this.transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false, // use STARTTLS
                auth: {
                    user: process.env.PROD_SMTP_EMAIL,
                    pass: process.env.PROD_SMTP_PASSWORD
                }
            });
        } else {
            console.warn('⚠️ SMTP credentials not found (SMTP_EMAIL, SMTP_PASSWORD). Email service disabled.');
        }
    }

    async sendEmail({ to, subject, text, html, attachments = [] }) {
        if (!this.transporter) {
            console.error('EmailService not initialized with credentials.');
            return false;
        }

        try {
            const mailOptions = {
                from: process.env.PROD_SMTP_EMAIL,
                to,
                subject,
                text,
                html,
                attachments
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent: %s', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending email:', error);
            return false;
        }
    }
}

export const emailService = new EmailService();
