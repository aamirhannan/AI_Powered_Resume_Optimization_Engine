
import { IApplication } from '#models/Application';

export interface IApplicationRepository {
    findDuplicate(email: string, role: string, since: Date): Promise<IApplication | null>;
    create(data: Partial<IApplication>): Promise<IApplication>;
    findByApplicationID(applicationID: string): Promise<IApplication | null>;
    findFailedApplications(): Promise<IApplication[]>;
    update(applicationID: string, updates: Partial<IApplication>): Promise<IApplication | null>;
}

// export class MongoApplicationRepository implements IApplicationRepository { ... } (Commented out)
import { SupabaseApplicationRepository } from './supabaseApplicationRepository.js';

export const applicationRepository = new SupabaseApplicationRepository();

