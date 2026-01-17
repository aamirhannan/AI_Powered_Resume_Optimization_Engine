import Application from '#models/Application';
export class MongoApplicationRepository {
    async findDuplicate(email, role, since) {
        return await Application.findOne({
            email,
            role,
            createdAt: { $gte: since }
        });
    }
    async create(data) {
        const app = new Application(data);
        return await app.save();
    }
    async findByApplicationID(applicationID) {
        return await Application.findOne({ applicationID });
    }
    async findFailedApplications() {
        return await Application.find({ status: 'IN_PROGRESS' });
    }
    async update(applicationID, updates) {
        // We use findOneAndUpdate to strictly decouple from the document instance method .save()
        // { new: true } returns the updated document
        // We map to applicationID (custom UUID) not _id
        return await Application.findOneAndUpdate({ applicationID }, { $set: { ...updates, updatedAt: new Date() } }, { new: true });
    }
}
// Singleton export or just class? Let's export an instance for ease of use 
// or let the controller instantiate it.
// Exporting class allows DI later.
export const applicationRepository = new MongoApplicationRepository();
