import { IEmailAutomationRepository } from './emailAutomation.js';
import { IEmailAutomation } from '#models/EmailAutomation';
import { supabase } from '#src/config/supabase';

export class SupabaseEmailAutomationRepository implements IEmailAutomationRepository {
    private tableName = 'email_automations';

    async create(data: Partial<IEmailAutomation>): Promise<IEmailAutomation> {
        const now = new Date();
        
        // Map camelCase to snake_case for DB
        const row = {
            user_id: data.userId,
            generated_resume_id: data.generatedResumeId,
            target_email: data.targetEmail,
            sender_email: data.senderEmail,
            job_description: data.jobDescription,
            role: data.role,
            company: data.company,
            subject_line: data.subjectLine,
            cover_letter: data.coverLetter,
            status: data.status || 'PENDING',
            error: data.error,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        };

        const { data: inserted, error } = await supabase
            .from(this.tableName)
            .insert(row)
            .select()
            .single();

        if (error) {
            console.error('Error creating email automation:', error);
            throw new Error(`Supabase create failed: ${error.message}`);
        }

        return this.mapToModel(inserted);
    }

    async findById(id: string): Promise<IEmailAutomation | null> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code !== 'PGRST116') {
                console.error('Error finding email automation by ID:', error);
            }
            return null;
        }

        return this.mapToModel(data);
    }

    async findDuplicate(targetEmail: string, role: string, since: Date): Promise<IEmailAutomation | null> {
        // Checking if we already have an automation for this target email + role since a certain date
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('target_email', targetEmail)
            .eq('role', role)
            .gte('created_at', since.toISOString())
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error finding duplicate email automation:', error);
        }

        return data ? this.mapToModel(data) : null;
    }

    async findFailed(): Promise<IEmailAutomation[]> {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .in('status', ['FAILED', 'IN_PROGRESS']); // Fetching failed or stuck in progress

        if (error) {
            console.error('Error finding failed email automations:', error);
            return [];
        }

        return (data || []).map(row => this.mapToModel(row));
    }

    async update(id: string, updates: Partial<IEmailAutomation>): Promise<IEmailAutomation | null> {
        const updatePayload: any = {
            updated_at: new Date().toISOString()
        };

        if (updates.status) updatePayload.status = updates.status;
        if (updates.error !== undefined) updatePayload.error = updates.error;
        if (updates.generatedResumeId) updatePayload.generated_resume_id = updates.generatedResumeId;
        if (updates.subjectLine) updatePayload.subject_line = updates.subjectLine;
        if (updates.coverLetter) updatePayload.cover_letter = updates.coverLetter;
        // Add others if needed

        const { data, error } = await supabase
            .from(this.tableName)
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating email automation:', error);
            return null;
        }

        return this.mapToModel(data);
    }

    private mapToModel(row: any): IEmailAutomation {
        return {
            id: row.id,
            userId: row.user_id,
            generatedResumeId: row.generated_resume_id,
            targetEmail: row.target_email,
            senderEmail: row.sender_email,
            jobDescription: row.job_description,
            role: row.role,
            company: row.company,
            subjectLine: row.subject_line,
            coverLetter: row.cover_letter,
            status: row.status,
            error: row.error,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
}
