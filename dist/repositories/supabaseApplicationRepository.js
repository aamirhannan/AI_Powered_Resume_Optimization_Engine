import { supabase } from '#src/config/supabase';
import { v4 as uuidv4 } from 'uuid';
export class SupabaseApplicationRepository {
    tableName = 'applications';
    async findDuplicate(email, role, since) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('email', email)
            .eq('role', role)
            .gte('created_at', since.toISOString())
            .limit(1)
            .single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is "JSON object requested, multiple (or no) rows returned" -> basically not found if single() used
            console.error('Error finding duplicate application:', error);
            // Don't throw, just return null to be safe? Or throw?
            // If it's a real error, maybe log and return null (conservative)
        }
        return data ? this.mapToApplication(data) : null;
    }
    async create(data) {
        const applicationID = data.applicationID || uuidv4();
        const now = new Date();
        const row = {
            application_id: applicationID, // Mapping to snake_case column
            role: data.role,
            job_description: data.jobDescription,
            email: data.email,
            status: data.status || 'PENDING',
            result: data.result || null,
            error: data.error || null,
            created_at: now.toISOString(),
            updated_at: now.toISOString()
        };
        const { data: inserted, error } = await supabase
            .from(this.tableName)
            .insert(row)
            .select()
            .single();
        if (error) {
            console.error('Error creating application:', error);
            throw new Error(`Supabase create failed: ${error.message}`);
        }
        return this.mapToApplication(inserted);
    }
    async findByApplicationID(applicationID) {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('application_id', applicationID)
            .single();
        if (error) {
            if (error.code !== 'PGRST116')
                console.error('Error finding app by ID:', error);
            return null;
        }
        return this.mapToApplication(data);
    }
    async findFailedApplications() {
        const { data, error } = await supabase
            .from(this.tableName)
            .select('*')
            .eq('status', 'IN_PROGRESS'); // The logic in retryFailedApplications looks for IN_PROGRESS? Or FAILED? 
        // Previous Mongo impl: find({ status: 'IN_PROGRESS' }) 
        // Logic in controller: "retryFailedApplications" -> "Fetch failed tasks" -> Application.find({ status: 'IN_PROGRESS' });
        // Wait, the controller comment says "Fetch failed tasks" but queries 'IN_PROGRESS'. 
        // It seems the intention is to pick up stuck jobs? 
        // Actually, in retryFailedApplications in controller:
        // "const failedApps = await applicationRepository.findFailedApplications();"
        // The method name is findFailed... but implementation was IN_PROGRESS.
        // I'll match the previous implementation for behavior consistency.
        if (error) {
            console.error('Error finding failed applications:', error);
            return [];
        }
        return (data || []).map(this.mapToApplication);
    }
    async update(applicationID, updates) {
        const updatePayload = {
            updated_at: new Date().toISOString()
        };
        if (updates.status)
            updatePayload.status = updates.status;
        if (updates.result)
            updatePayload.result = updates.result;
        if (updates.error !== undefined)
            updatePayload.error = updates.error;
        // Add other fields if necessary
        const { data, error } = await supabase
            .from(this.tableName)
            .update(updatePayload)
            .eq('application_id', applicationID)
            .select()
            .single();
        if (error) {
            console.error('Error updating application:', error);
            return null;
        }
        return this.mapToApplication(data);
    }
    mapToApplication(row) {
        return {
            _id: row.id, // Supabase internal PK
            applicationID: row.application_id,
            role: row.role,
            jobDescription: row.job_description,
            email: row.email,
            status: row.status,
            result: row.result,
            error: row.error,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
        };
    }
}
