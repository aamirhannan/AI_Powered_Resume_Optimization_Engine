import express from 'express';
import { getRequestApiLogs } from '../controllers/apiRequestLogController.js';

const router = express.Router();

router.get('/get-all-logs', getRequestApiLogs);
export default router;