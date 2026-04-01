import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from root directory (../.env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import resumeRoutes from './routes/resumeRoutes.js';
import connectDB from './config/db.js';
import { startWorker } from './workers/jobWorker.js';
import routes from './routes/index.js';
import { startTelegramBot } from './bot/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

import { authMiddleware } from './middleware/authMiddleware.js';
import { userAuthMiddleware } from './middleware/userAuthMiddleware.js';

// Middleware
app.use(cors());

import webhookRoutes from './routes/webhookRoutes.js';
app.use('/api/webhooks', webhookRoutes);

app.use(bodyParser.json());

// Routes
app.use('/api', resumeRoutes);
app.use('/api/v1', authMiddleware, userAuthMiddleware, routes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
console.log('Starting DB connection...');
connectDB().then(() => {
    console.log('DB connection established.');
}).catch((err) => {
    console.error('Initial DB connection failed:', err);
});

console.log(`Attempting to bind server to port ${PORT} on 0.0.0.0`);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is successfully bound and running on http://0.0.0.0:${PORT}`);
    // Start the background worker
    startWorker();
    startTelegramBot();
});