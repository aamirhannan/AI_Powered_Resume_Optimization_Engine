import nodemailer from 'nodemailer';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class EmailService {
    constructor() {
        // Stateless service
    }

    async sendEmail({ from, to, subject, text, html, attachments = [] }) {
        if (!this.transporter) {
            throw new Error('Transporter not initialized');
        }
        return this._send(this.transporter, { from, to, subject, text, html, attachments });
    }

    async sendEmailWithOAuth({ user, accessToken, refreshToken, to, subject, text, html, attachments = [] }) {
        // 1. Refresh Token to ensure validity
        let validAccessToken = accessToken;
        try {
            const refreshedToken = await this._refreshAccessToken(refreshToken);
            if (refreshedToken) {
                validAccessToken = refreshedToken;
            }
        } catch (error) {
            // Silently fail refresh and try with existing token
            // In a production environment you might want to log this or throw
        }

        try {
            // 2. Create the Raw MIME message
            const rawMessage = await this._createRawMessage({ user, to, subject, text, html, attachments });

            // 3. Send via Gmail API
            const sendResponse = await axios.post(
                'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                { raw: rawMessage },
                {
                    headers: {
                        'Authorization': `Bearer ${validAccessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return true;

        } catch (apiError) {
            const errorMsg = apiError.response ? JSON.stringify(apiError.response.data) : apiError.message;
            throw new Error(`Gmail API Send Failed: ${errorMsg}`);
        }
    }

    async _createRawMessage({ user, to, subject, text, html, attachments }) {
        const streamTransporter = nodemailer.createTransport({
            streamTransport: true,
            newline: 'unix',
            buffer: true
        });

        const mailOptions = {
            from: user,
            to,
            subject,
            text,
            html, // Add HTML support
            attachments
        };

        const info = await streamTransporter.sendMail(mailOptions);
        return info.message.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    async _refreshAccessToken(refreshToken) {
        try {
            const response = await axios.post('https://oauth2.googleapis.com/token', {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            return response.data.access_token;
        } catch (error) {
            throw error;
        }
    }

    async _send(transporter, mailOptions) {
        if (!transporter) return false;
        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            throw error;
        }
    }
}
export const emailService = new EmailService();
