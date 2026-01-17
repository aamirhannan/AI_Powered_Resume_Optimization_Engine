// export class MongoApplicationRepository implements IApplicationRepository { ... } (Commented out)
import { SupabaseApplicationRepository } from './supabaseApplicationRepository.js';
export const applicationRepository = new SupabaseApplicationRepository();
