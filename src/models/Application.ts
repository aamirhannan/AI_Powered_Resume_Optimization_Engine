// Plain TypeScript Interface for Application
// formerly extended mongoose.Document
export interface IApplication {
    _id?: string; // Optional for compatibility if needed, or mapped from id
    applicationID: string; // The UUID we use for business logic
    role: string;
    jobDescription: string;
    email: string; // Recruiter/Target Email
    status: 'PENDING' | 'IN_PROGRESS' | 'FAILED' | 'SUCCESS';
    result?: any;
    error?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// We no longer export a Mongoose model
// export default Application;

