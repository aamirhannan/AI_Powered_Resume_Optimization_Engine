export interface IEmailAutomation {
    id?: string; // PK
    userId: string;
    generatedResumeId?: string | null;
    targetEmail: string;
    senderEmail: string;
    jobDescription?: string | null;
    role?: string | null;
    company?: string | null;
    subjectLine?: string | null;
    coverLetter?: string | null;
    status: 'PENDING' | 'IN_PROGRESS' | 'FAILED' | 'SUCCESS';
    error?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
