
import Application, { IApplication } from '#models/Application';

export interface IApplicationRepository {
    findDuplicate(email: string, role: string, since: Date): Promise<IApplication | null>;
    create(data: Partial<IApplication>): Promise<IApplication>;
    findByApplicationID(applicationID: string): Promise<IApplication | null>;
    findFailedApplications(): Promise<IApplication[]>;
    update(applicationID: string, updates: Partial<IApplication>): Promise<IApplication | null>;
}

export class MongoApplicationRepository implements IApplicationRepository {
    async findDuplicate(email: string, role: string, since: Date): Promise<IApplication | null> {
        return await Application.findOne({
            email,
            role,
            createdAt: { $gte: since }
        });
    }

    async create(data: Partial<IApplication>): Promise<IApplication> {
        const app = new Application(data);
        return await app.save();
    }

    async findByApplicationID(applicationID: string): Promise<IApplication | null> {
        return await Application.findOne({ applicationID });
    }

    async findFailedApplications(): Promise<IApplication[]> {
         return await Application.find({ status: 'IN_PROGRESS' });
    }

    async update(applicationID: string, updates: Partial<IApplication>): Promise<IApplication | null> {
        // We use findOneAndUpdate to strictly decouple from the document instance method .save()
        // { new: true } returns the updated document
        // We map to applicationID (custom UUID) not _id
        return await Application.findOneAndUpdate(
            { applicationID }, 
            { $set: { ...updates, updatedAt: new Date() } }, 
            { new: true }
        );
    }
}

// Singleton export or just class? Let's export an instance for ease of use 
// or let the controller instantiate it.
// Exporting class allows DI later.
export const applicationRepository = new MongoApplicationRepository();
