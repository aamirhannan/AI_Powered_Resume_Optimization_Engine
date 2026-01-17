import { IEmailAutomation } from '#models/EmailAutomation';
import { SupabaseEmailAutomationRepository } from './supabaseEmailAutomationRepository.js';

export interface IEmailAutomationRepository {
    create(data: Partial<IEmailAutomation>): Promise<IEmailAutomation>;
    findById(id: string): Promise<IEmailAutomation | null>;
    findDuplicate(targetEmail: string, role: string, since: Date): Promise<IEmailAutomation | null>;
    findFailed(): Promise<IEmailAutomation[]>;
    update(id: string, updates: Partial<IEmailAutomation>): Promise<IEmailAutomation | null>;
}

export const emailAutomationRepository = new SupabaseEmailAutomationRepository();
