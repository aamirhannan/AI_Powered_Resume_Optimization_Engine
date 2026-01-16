
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const applicationSchema = new mongoose.Schema({
    applicationID: {
        type: String,
        default: uuidv4,
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'FAILED', 'SUCCESS'],
        default: 'PENDING'
    },
    result: {
        type: Object, // Store final result/details here if needed
        default: null
    },
    error: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Application = mongoose.model('Application', applicationSchema);

export default Application;
