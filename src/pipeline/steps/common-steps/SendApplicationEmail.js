import { Step } from '../../Step.js';
import { emailService } from '../../../services/emailService.js';

import path from 'path';

export class SendApplicationEmail extends Step {
    constructor() {
        super('SendApplicationEmail');
    }

    async execute(context) {
        const { targetEmail, emailSubject, coverLetter, pdfPath, email, user_id, supabase } = context;

        this._validateContext(context);

        const sanitizedEmail = targetEmail.normalize('NFKC').trim();
        const gmailAuth = await this._getGmailIntegration(supabase, user_id);

        if (!gmailAuth?.access_token || !gmailAuth?.refresh_token) {
            throw new Error(`Gmail Integration incomplete for user ${user_id}. Please reconnect Gmail.`);
        }

        const htmlCoverLetter = coverLetter
            ? `<div style="font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #000000;">
                ${coverLetter.split('\n').map(line => line.trim() ? `<p style="margin-bottom: 16px;">${line}</p>` : '').join('')}
               </div>`
            : null;

        const success = await emailService.sendEmailWithOAuth({
            user: gmailAuth.connected_email || email,
            to: sanitizedEmail,
            subject: emailSubject || 'Job Application',
            text: coverLetter || 'Please find my resume attached.',
            html: htmlCoverLetter,
            accessToken: gmailAuth.access_token,
            refreshToken: gmailAuth.refresh_token,
            attachments: pdfPath ? [{
                path: pdfPath,
                filename: path.basename(pdfPath)
            }] : []
        });

        if (!success) {
            throw new Error('Failed to send email via Gmail OAuth.');
        }

        return {
            ...context,
            emailSent: true
        };
    }

    _validateContext(context) {
        if (!context.targetEmail) throw new Error('Target email is missing in context.');
        if (!context.supabase) throw new Error('Supabase client is missing in context.');
        if (!context.user_id) throw new Error('User ID is missing in context.');
    }

    async _getGmailIntegration(supabase, user_id) {
        const { data, error } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('user_id', user_id)
            .eq('provider', 'GMAIL')
            .single();

        if (error || !data) {
            // Log error internally if needed, or just return null
            return null;
        }
        return data;
    }
}
