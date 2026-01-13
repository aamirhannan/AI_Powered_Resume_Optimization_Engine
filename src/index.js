import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import resumeRoutes from './routes/resumeRoutes.js';
import connectDB from './config/db.js';
import { startWorker } from './workers/jobWorker.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', resumeRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    // Start the background worker
    startWorker();
});
