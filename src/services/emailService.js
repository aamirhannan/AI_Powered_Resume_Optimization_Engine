import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Force IPv4 to avoid IPv6 connection issues in some cloud environments (like Render)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class EmailService {
    constructor() {
        // Stateless service
    }

    // Removed init() as verified credentials are now required per-request

    async sendEmail({ from, to, subject, text, html, attachments = [] }) {
        // ... (Keep existing implementation for backward compatibility or remove if strictly moving to dynamic)
        if (!this.transporter) {
            // Fallback to init if missing? 
            // Logic stays same for default env usage
        }
        // ...
        return this._send(this.transporter, { from, to, subject, text, html, attachments });
    }

    async sendEmailWithAuth({ user, pass, to, subject, text, html, attachments = [] }) {
        const tempTransporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // Use SSL
            auth: { user, pass },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 10000
        });

        return this._send(tempTransporter, { from: user, to, subject, text, html, attachments });
    }

    async verifyCredentials(user, pass) {
        try {
            const tempTransporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true, // Use SSL
                auth: { user, pass },
                connectionTimeout: 10000, // 10 seconds
                greetingTimeout: 10000,
                socketTimeout: 10000
            });
            await tempTransporter.verify();
            return true;
        } catch (error) {
            console.error('SMTP Credential Check Failed:', error);
            return false;
        }
    }

    async _send(transporter, mailOptions) {
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
